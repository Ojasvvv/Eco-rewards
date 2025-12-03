import { adminDb, adminAuth, ensureInitialized } from './_middleware/firebaseAdmin.js';
import { withRateLimitFirestore as withRateLimit } from './_middleware/rateLimiterFirestore.js';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';

const db = adminDb;

// Email configuration - set these in Vercel environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Resend default domain for testing

// Initialize Resend
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function sendDailyStatsEmailHandler(req, res) {
  // Set CORS headers first, before any checks
  const origin = req.headers.origin;
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
  const LOCALHOST_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5174'
  ];
  // Production frontend origins
  const PRODUCTION_ORIGINS = [
    'https://new-repo-seven-steel.vercel.app',
    'https://eco-rewards-wheat.vercel.app'
  ];
  const ALL_ALLOWED_ORIGINS = [...new Set([...ALLOWED_ORIGINS, ...LOCALHOST_ORIGINS, ...PRODUCTION_ORIGINS])];

  // Always set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Cron-Secret');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Set Access-Control-Allow-Origin header - MUST be set for CORS to work
  if (origin) {
    // Always allow localhost/127.0.0.1 (for local development)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Allow if in allowed origins list
    else if (ALL_ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Allow if from the production domain
    else if (origin.includes('eco-rewards-wheat.vercel.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Fallback: allow any origin in development (helps with CORS preflight)
    else {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log the method for debugging
  console.log(`[sendDailyStatsEmail] Received ${req.method} request from ${origin || 'unknown origin'}`);

  // Allow both GET and POST (GET for testing, POST for actual requests)
  if (req.method !== 'POST' && req.method !== 'GET') {
    console.error(`[sendDailyStatsEmail] Method not allowed: ${req.method}`);
    return res.status(405).json({ error: `Method not allowed: ${req.method}. Use POST or GET.` });
  }

  try {
    await ensureInitialized();
    
    // Support both manual calls (Bearer token) and scheduled cron calls (CRON_SECRET)
    const authHeader = req.headers.authorization;
    const cronSecret = req.headers['x-cron-secret'] || req.headers['authorization'];
    
    let isCronCall = false;
    let userId = null;

    // Check if this is a cron job call
    if (cronSecret === process.env.CRON_SECRET) {
      isCronCall = true;
      console.log('📅 Scheduled cron job triggered');
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Manual call - verify user token
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      console.log('👤 Manual email request from user:', userId);
    } else {
      return res.status(401).json({ error: 'Unauthorized - Missing authentication' });
    }

    // Get today's date range (start and end of today)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Convert to Firestore Timestamps
    const startTimestamp = Timestamp.fromDate(startOfToday);
    const endTimestamp = Timestamp.fromDate(endOfToday);

    // Get all location logs from today
    const locationLogsSnapshot = await db.collection('locationLogs')
      .where('timestamp', '>=', startTimestamp)
      .where('timestamp', '<', endTimestamp)
      .orderBy('timestamp', 'desc')
      .get();

    // Get all pickups - need to filter by date since createdAt is ISO string
    const allPickupsSnapshot = await db.collection('pickups')
      .orderBy('createdAt', 'desc')
      .get();

    // Get all transactions from today
    const transactionsSnapshot = await db.collection('transactions')
      .where('timestamp', '>=', startTimestamp)
      .where('timestamp', '<', endTimestamp)
      .orderBy('timestamp', 'desc')
      .get();

    // Process location logs
    const locationLogs = [];
    const userIds = new Set();
    
    for (const doc of locationLogsSnapshot.docs) {
      const data = doc.data();
      userIds.add(data.userId);
      locationLogs.push({
        userId: data.userId,
        dustbinCode: data.dustbinCode || 'Unknown',
        location: data.location || {},
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        points: data.points || 0,
      });
    }

    // Get user details for all users who used bins today
    const userDetails = {};
    for (const userId of userIds) {
      try {
        const userRecord = await adminAuth.getUser(userId);
        userDetails[userId] = {
          firstName: userRecord.displayName?.split(' ')[0] || userRecord.email?.split('@')[0] || 'User',
          email: userRecord.email,
          fullName: userRecord.displayName || userRecord.email,
        };
      } catch (error) {
        userDetails[userId] = {
          firstName: 'Unknown',
          email: 'Unknown',
          fullName: 'Unknown User',
        };
      }
    }

    // Process pickups - filter by today's date
    const pickups = [];
    const startOfTodayISO = startOfToday.toISOString();
    const endOfTodayISO = endOfToday.toISOString();
    
    for (const doc of allPickupsSnapshot.docs) {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      // Filter pickups created today
      if (createdAt && createdAt >= startOfTodayISO && createdAt < endOfTodayISO) {
        pickups.push({
          userId: data.userId,
          userName: data.userName || 'Unknown',
          userEmail: data.userEmail || 'Unknown',
          wasteCategory: data.wasteCategory || 'Unknown',
          address: data.address || 'Unknown',
          date: data.date || 'Unknown',
          timeSlot: data.timeSlot || 'Unknown',
          status: data.status || 'pending',
          createdAt: data.createdAt,
        });
      }
    }

    // Process transactions
    const transactions = [];
    for (const doc of transactionsSnapshot.docs) {
      const data = doc.data();
      transactions.push({
        userId: data.userId,
        type: data.type || 'Unknown',
        points: data.points || 0,
        reason: data.reason || '',
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
      });
    }

    // Group location logs by dustbin code
    const binUsage = {};
    locationLogs.forEach(log => {
      const binCode = log.dustbinCode;
      if (!binUsage[binCode]) {
        binUsage[binCode] = [];
      }
      const user = userDetails[log.userId] || { firstName: 'Unknown', email: 'Unknown' };
      binUsage[binCode].push({
        firstName: user.firstName,
        email: user.email,
        location: log.location,
        timestamp: log.timestamp,
        points: log.points,
      });
    });

    // Create HTML email
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f5f5f5; 
            margin: 0; 
            padding: 20px; 
          }
          .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
          }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 32px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 30px; }
          .section { margin-bottom: 40px; }
          .section h2 { 
            color: #10b981; 
            border-bottom: 3px solid #10b981; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
            font-size: 24px;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px; 
          }
          .stat-card { 
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #10b981; 
            text-align: center;
          }
          .stat-label { 
            font-size: 14px; 
            color: #6b7280; 
            margin-bottom: 8px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stat-value { 
            font-size: 32px; 
            font-weight: bold; 
            color: #10b981; 
          }
          .bin-card { 
            background: #f9fafb; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px; 
            border-left: 4px solid #6366f1; 
          }
          .bin-card h3 { 
            margin: 0 0 15px 0; 
            color: #6366f1; 
            font-size: 20px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px; 
            background: white;
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e5e7eb; 
          }
          th { 
            background: #10b981; 
            color: white; 
            font-weight: 600; 
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          tr:hover { background: #f9fafb; }
          .pickup-card { 
            background: #fef3c7; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border-left: 4px solid #f59e0b; 
          }
          .pickup-card h4 { margin: 0 0 10px 0; color: #d97706; }
          .status-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 12px; 
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-pending { background: #fef3c7; color: #d97706; }
          .status-confirmed { background: #dbeafe; color: #2563eb; }
          .status-completed { background: #d1fae5; color: #059669; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .empty-state {
            text-align: center;
            padding: 40px;
            color: #6b7280;
          }
          .empty-state-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 10px !important;
            }
            .container {
              max-width: 100% !important;
              border-radius: 8px !important;
            }
            .header {
              padding: 25px 20px !important;
            }
            .header h1 {
              font-size: 24px !important;
            }
            .header p {
              font-size: 14px !important;
            }
            .content {
              padding: 20px 15px !important;
            }
            .section {
              margin-bottom: 30px !important;
            }
            .section h2 {
              font-size: 20px !important;
              padding-bottom: 8px !important;
              margin-bottom: 15px !important;
            }
            .summary-grid {
              grid-template-columns: 1fr !important;
              gap: 10px !important;
            }
            .stat-card {
              padding: 15px !important;
            }
            .stat-label {
              font-size: 12px !important;
            }
            .stat-value {
              font-size: 28px !important;
            }
            .bin-card {
              padding: 15px !important;
              margin: 15px 0 !important;
            }
            .bin-card h3 {
              font-size: 18px !important;
            }
            table {
              font-size: 12px !important;
              table-layout: fixed !important;
              word-wrap: break-word !important;
            }
            th, td {
              padding: 8px !important;
              font-size: 11px !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              max-width: 120px !important;
            }
            th {
              font-size: 10px !important;
            }
            .pickup-card {
              padding: 12px !important;
              margin: 12px 0 !important;
            }
            .pickup-card h4 {
              font-size: 16px !important;
            }
            .pickup-card table {
              font-size: 12px !important;
            }
            .empty-state {
              padding: 30px 20px !important;
            }
            .empty-state-icon {
              font-size: 36px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Stats Report</h1>
            <p>${today}</p>
            <p style="font-size: 14px; margin-top: 10px; opacity: 0.8;">EcoRewards System - Automated Daily Summary</p>
          </div>

          <div class="content">
            <!-- Summary Section -->
            <div class="section">
              <h2>📈 Today's Summary</h2>
              <div class="summary-grid">
                <div class="stat-card">
                  <div class="stat-label">Bin Usages</div>
                  <div class="stat-value">${locationLogs.length}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Unique Users</div>
                  <div class="stat-value">${userIds.size}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Pickup Requests</div>
                  <div class="stat-value">${pickups.length}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Active Bins</div>
                  <div class="stat-value">${Object.keys(binUsage).length}</div>
                </div>
              </div>
            </div>

            <!-- Bin Usage by Location -->
            <div class="section">
              <h2>🗑️ Bin Usage by Location</h2>
              ${Object.keys(binUsage).length > 0 ? Object.entries(binUsage).map(([binCode, usages]) => `
                <div class="bin-card">
                  <h3>📍 Bin Code: ${binCode}</h3>
                  <p style="margin: 0 0 15px 0; color: #6b7280;"><strong>${usages.length}</strong> usage(s) today</p>
                  <table>
                    <tr>
                      <th>First Name</th>
                      <th>Email</th>
                      <th>Exact Location</th>
                      <th>Time</th>
                      <th>Points</th>
                    </tr>
                    ${usages.map(usage => `
                      <tr>
                        <td><strong>${usage.firstName}</strong></td>
                        <td>${usage.email}</td>
                        <td>${usage.location.latitude ? `${usage.location.latitude.toFixed(6)}, ${usage.location.longitude.toFixed(6)}` : 'N/A'}</td>
                        <td>${new Date(usage.timestamp).toLocaleString()}</td>
                        <td>+${usage.points}</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
              `).join('') : '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No bin usage recorded today</p></div>'}
            </div>

            <!-- All Location Logs -->
            <div class="section">
              <h2>📍 Complete Location Logs</h2>
              ${locationLogs.length > 0 ? `
                <table>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Bin Code</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Points</th>
                  </tr>
                  ${locationLogs.map(log => {
                    const user = userDetails[log.userId] || { firstName: 'Unknown', email: 'Unknown' };
                    return `
                      <tr>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                        <td><strong>${user.firstName}</strong><br><small style="color: #6b7280;">${user.email}</small></td>
                        <td>${log.dustbinCode}</td>
                        <td>${log.location.latitude?.toFixed(6) || 'N/A'}</td>
                        <td>${log.location.longitude?.toFixed(6) || 'N/A'}</td>
                        <td>+${log.points}</td>
                      </tr>
                    `;
                  }).join('')}
                </table>
              ` : '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No location logs for today</p></div>'}
            </div>

            <!-- Pickup Requests -->
            <div class="section">
              <h2>🚚 Pickup Requests</h2>
              ${pickups.length > 0 ? pickups.map(pickup => `
                <div class="pickup-card">
                  <h4>📦 Pickup Request</h4>
                  <table style="width: 100%; background: transparent;">
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>User:</strong></td>
                      <td style="border: none; padding: 5px 12px;">${pickup.userName} (${pickup.userEmail})</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>Waste Category:</strong></td>
                      <td style="border: none; padding: 5px 12px;">${pickup.wasteCategory}</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>Address:</strong></td>
                      <td style="border: none; padding: 5px 12px;">${pickup.address}</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>Date:</strong></td>
                      <td style="border: none; padding: 5px 12px;">${pickup.date}</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>Time Slot:</strong></td>
                      <td style="border: none; padding: 5px 12px;">${pickup.timeSlot}</td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>Status:</strong></td>
                      <td style="border: none; padding: 5px 12px;">
                        <span class="status-badge status-${pickup.status}">${pickup.status}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="border: none; padding: 5px 12px;"><strong>Requested At:</strong></td>
                      <td style="border: none; padding: 5px 12px;">${new Date(pickup.createdAt).toLocaleString()}</td>
                    </tr>
                  </table>
                </div>
              `).join('') : '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No pickup requests today</p></div>'}
            </div>

            <!-- All Transactions -->
            <div class="section">
              <h2>💰 Today's Transactions</h2>
              ${transactions.length > 0 ? `
                <table>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Details</th>
                  </tr>
                  ${transactions.map(txn => {
                    const user = userDetails[txn.userId] || { firstName: 'Unknown', email: 'Unknown' };
                    return `
                      <tr>
                        <td>${new Date(txn.timestamp).toLocaleString()}</td>
                        <td>${user.firstName}</td>
                        <td>${txn.type}</td>
                        <td style="color: ${txn.points > 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">
                          ${txn.points > 0 ? '+' : ''}${txn.points}
                        </td>
                        <td>${txn.reason || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </table>
              ` : '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No transactions today</p></div>'}
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    let emailSent = false;
    let emailError = null;

    if (!resend) {
      console.warn('⚠️ Resend API key not configured. Email will not be sent.');
      console.log('📧 Email would be sent to:', ADMIN_EMAIL);
      console.log('📧 Subject: Daily Stats Report - ' + today);
    } else {
      try {
        const emailResult = await resend.emails.send({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `📊 Daily Stats Report - ${today}`,
          html: emailHTML,
          text: `Daily Stats Report for ${today}\n\nBin Usages: ${locationLogs.length}\nUnique Users: ${userIds.size}\nPickup Requests: ${pickups.length}\nActive Bins: ${Object.keys(binUsage).length}\n\nSee full report in HTML email.`,
        });

        if (emailResult.error) {
          emailError = emailResult.error.message || 'Unknown error';
          console.error('❌ Resend API error:', emailResult.error);
        } else {
          emailSent = true;
          console.log('✅ Email sent successfully via Resend:', emailResult.data?.id);
        }
      } catch (error) {
        emailError = error.message || 'Failed to send email';
        console.error('❌ Error sending email via Resend:', error);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Daily stats email sent successfully!' 
        : emailError 
          ? `Email generation succeeded but sending failed: ${emailError}`
          : 'Daily stats email generated (email service not configured)',
      data: {
        binUsages: locationLogs.length,
        uniqueUsers: userIds.size,
        pickupRequests: pickups.length,
        activeBins: Object.keys(binUsage).length,
        emailSent,
        emailError: emailError || null,
      }
    });

  } catch (error) {
    console.error('Error sending daily stats email:', error);
    return res.status(500).json({ 
      error: 'Failed to generate daily stats email', 
      details: error.message 
    });
  }
}

export default withRateLimit('sendDailyStatsEmail', sendDailyStatsEmailHandler);

