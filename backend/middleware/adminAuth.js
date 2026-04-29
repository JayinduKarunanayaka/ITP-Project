import userModel from "../model/userModel.js";

const adminAuth = async (req, res, next) => {
    try {
        const userId = req.userId || req.body.userId; 

        if (!userId) {
            return res.json({ success: false, message: "Not Authorized. Login Again." });
        }
        
        const user = await userModel.findById(userId);

        if (!user || user.role !== 'Admin') {
            return res.json({ success: false, message: "Access Denied. Admins only." });
        }

        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export default adminAuth;