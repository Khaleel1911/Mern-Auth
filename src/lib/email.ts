import nodemailer from 'nodemailer';

export async function sendEmail(to:string,subject:string, html:string){
    if(!process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS 
    ){
        console.log("Email env's are not available!");
        return;
    }

    const host=process.env.SMTP_HOST;
    const port= Number(process.env.SMTP_PORT || "587");
    const user= process.env.SMTP_USER;
    const pass= process.env.SMTP_PASS;
    const from=process.env.EMAIL_FROM;

    // Looking to send emails in production? Check out our Email API/SMTP product!
    var transport = nodemailer.createTransport({
    host: host,
    port: port,
    secure:false,
    auth: {
        user,
        pass
    }
    });

    await transport.sendMail({
        from,to,subject,html
    })
}