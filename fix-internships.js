/**
 * Run ONE TIME to patch existing internships with createdBy.
 * Uses native MongoDB driver directly — bypasses Mongoose cast errors.
 *
 * Run from your project root:
 *   node fix-internships.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const db = mongoose.connection.db;

    // Find your company user
    const company = await db.collection('users').findOne({ role: 'company' });
    if (!company) {
        console.log('No company user found. Exiting.');
        process.exit(1);
    }
    console.log(`Company: ${company.name} (${company.email}) | _id: ${company._id}`);

    // Use native driver — no Mongoose casting, handles any value in createdBy
    // This matches documents where createdBy is missing, null, undefined, or empty string
    const result = await db.collection('internships').updateMany(
        {
            $or: [
                { createdBy: { $exists: false } },
                { createdBy: null },
                { createdBy: '' }
            ]
        },
        {
            $set: { createdBy: company._id }   // sets as proper ObjectId
        }
    );

    console.log(`\n✅ Done! Modified ${result.modifiedCount} internship(s)`);

    // Verify
    const internships = await db.collection('internships').find({}).toArray();
    console.log('\nAll internships now:');
    internships.forEach(i => console.log(`  - "${i.title}" | createdBy: ${i.createdBy}`));

    process.exit(0);
}

fix().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});