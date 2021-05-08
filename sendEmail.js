require('dotenv').config()
const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const OAuth2 = google.auth.OAuth2

async function sendMail(email, subject, message) {
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID, 
        process.env.CLIENT_SECRET,
        "https://developers.google.com/oauthplayground" 
   );

   oauth2Client.setCredentials({
       refresh_token: process.env.REFRESH_TOKEN
   })

   const accessToken = await oauth2Client.getAccessToken()
   console.log({accessToken})

   const mailer = nodemailer.createTransport({
       service : 'gmail',
       auth : {
           type : 'OAuth2',
           user : process.env.SENDER_EMAIL,
           clientId : process.env.CLIENT_ID,
           clientSecret : process.env.CLIENT_SECRET,
           refreshToken : process.env.REFRESH_TOKEN,
           accessToken : accessToken
       },
       tls : {
        rejectUnauthorized: false
       }
   })

    const mailOptions = {
        from : process.env.SENDER_EMAIL,
        to : email,
        subject: subject,
        generateTextFromHTML: true,
        html : message
    }

    mailer.sendMail(mailOptions,(err,info)=>{
        err ? console.log(err) : console.log(info)
        mailer.close()
    })        
}

module.exports = sendMail