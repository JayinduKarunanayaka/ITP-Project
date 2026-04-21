import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET } from '../config/emaiTemplate.js';

//registration process
export const register = async (req, res)=>{
    const {name,birthday,email,password,role}=req.body;

    if(!name || !birthday || !email || !password){
        return res.json({success: false, message : "Missing Details"})
    }

    try{
        
        const existingUser = await userModel.findOne({email})

        if(existingUser){
            return res.json({success: false, message : "User already exists"})
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new userModel({name,birthday,email,password:hashedPassword,role: role || "Patient" });
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});
        res.cookie('token', token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none': 'strict',
            maxAge: 7*24*60*60*1000
        });

        //sending welcome email
        const mailOptions ={
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Medication App!',
            text: `Welcome to medication App. Your account has been created with email ID : ${email}`
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true});

    } catch(error){
        res.json({success: false, message : error.message})
    }
};

//Login process
export const login = async(req,res)=>{
    const {email,password,role}=req.body;

    if(!email || !password){
        return res.json({
            success: false, message:'Email and password are required'
        })
    }

    try{

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({
                success: false, message:'Invalid email'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.json({
                success: false, message:'Invalid Password'
            });
        }

        if (role === 'Admin' && user.role !== 'Admin') {
            return res.json({ success: false, message: 'Access Denied: You do not have Admin privileges' });
        }
        
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});
        res.cookie('token', token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none': 'strict',
            maxAge: 7*24*60*60*1000
        });

        return res.json({ 
            success: true, 
            role: user.role, 
            message: "Login Successful" 
        });
        
    }catch(error){
        return res.json({success: false, message : error.message});
    }
}

//logout process
export const logout = async(req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none': 'strict',
        })

        return res.json({success: true, message : "Logged Out"});

    }catch(error){
        return res.json({success: false, message : error.message});
    }
}

//Send OTP
export const sendVerifyOtp = async (req,res)=>{
    try{

        const {userId} = req.body;
        const user = await userModel.findById(userId);

        if(user.isAccountVerified){
            return res.json({success:false, message: "Account already verified!"})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24*60*60*1000

        await user.save();

        const mailOption ={
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account verification OTP',
            html : EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }

        await transporter.sendMail(mailOption);

        res.json({success:true, message: "Verification OTP send on Email"});

    }catch(error){
        res.json({success:false, message: error.message});
    }
}

//verify account
export const verifyEmail = async(req,res)=>{
    const {userId, otp} = req.body;

    if(!userId || !otp){
        res.json({success:false, message: "Missing Details!"});
    }

    try{
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success:false, message: "User Not Found!"});
        }

        if(user.verifyOtp === ""||user.verifyOtp !== otp){
            return res.json({success:false, message: "Invalid OTP!"});
        }

        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success:false, message: "OTP is Expired!"});
        }

        user.isAccountVerified = true;
        user.verifyOtp ="";
        user.verifyOtpExpireAt=0;

        await user.save();
        return res.json({success:true, message: "Email Verification Successful!"});

    }catch(error){
        res.json({success:false, message: error.message});
    }
}

//is user uthenticated
export const isAuthenticated = async(req,res)=>{
    try{
        return res.json({success: true});
    }catch(error){
        res.json({success:false, message: error.message});
    }
}

//send password reset OTP
export const sendResteOtp = async (req,res)=>{
    const{email}=req.body;

    if(!email){
        return res.json({success:false, message: "Email is Required!"});
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false, message: "User not found!"});
        }

         const otp = String(Math.floor(100000 + Math.random() * 900000));
        
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15*60*1000
        await user.save();

        const mailOption ={
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'password reset OTP',
            html : PASSWORD_RESET.replace("{{otp}}",otp).replace("{{email}}",user.email)
        };

        await transporter.sendMail(mailOption);

        return res.json({success:true, message: "Password Reset OTP is sended to Your email"});

    }catch(error){
        return res.json({success:false, message: error.message});
    }
}

//reset password
export const resetPassword = async(req,res)=>{
    const {email,otp, newPassword} = req.body;

    if(!email || !otp ||!newPassword){
        return res.jsom({success:false, message: "Email,otp and new Password are required!"});
    }

    try{
        const user = await userModel.findOne({email});
        if(!email){
            return res.json({success:false, message: "User not available!"});
        }

        if(user.resetOtp ==="" || user.resetOtp !== otp){
            return res.json({success:false, message: "Invalid OTP"});
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success:false, message: "OTP Expired!"});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp ="";
        user.resetOtpExpireAt=0;

        await user.save();

        return res.json({success:true, message: 'password are succesfully reset'});

    }catch(error){
        return res.json({success:false, message: error.message});
    }
}

//seed a admin
export const seedAdmin = async (req, res) => {
    try {
        const { email, password, adminSecret } = req.body;

        if (adminSecret !== "MY_SECRET_KEY_123") {
            return res.json({ success: false, message: "Invalid Secret Key" });
        }

        const existingAdmin = await userModel.findOne({ email });
        if (existingAdmin) return res.json({ success: false, message: "Admin already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new userModel({
            name: "System Admin",
            email: email,
            password: hashedPassword,
            birthday: "1990-01-01",
            role: "Admin",
            isAccountVerified: true 
        });

        await newAdmin.save();
        res.json({ success: true, message: "Admin seeded successfully!" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}