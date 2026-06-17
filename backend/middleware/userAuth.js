import jwt from 'jsonwebtoken';

const extractToken = (req) => {
    const cookieToken = req.cookies?.token;
    if (cookieToken) return cookieToken;

    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    return '';
};

const userAuth = async(req,res,next)=>{
    const token = extractToken(req);

    if(!token){
        return res.status(401).json({success: false, message: "Not Authorized. Login Again!"});
    }

    try{
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id){
            req.body = req.body || {};
            req.body.userId = tokenDecode.id;
            req.userId = tokenDecode.id;
            req.authToken = token;
            next();
        }else{
            return res.status(401).json({success: false, message: "Not Authorized. Login Again!"});
        }

    }catch(error){
       res.status(401).json({ success: false, message: error.message });
    }
}

export default userAuth;