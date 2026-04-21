import userModel from "../model/userModel.js";

const adminAuth = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.body.userId);

        if (!user ||user.role !== 'Admin') {
            return res.json({ success: false, message: "Access Denied. Admins only." });
        }

        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export default adminAuth;