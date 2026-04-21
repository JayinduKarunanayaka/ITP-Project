import userModel from "../model/userModel.js";
import bcrypt from 'bcryptjs';

// get user data
export const getUserData = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found!" });
        }

        // Calculate Age
        const today = new Date();
        const birthDate = new Date(user.birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // Calculate BMI (For Patients)
        let bmi = 0;
        if (user.height > 0 && user.weight > 0) {
            const heightInMeters = user.height * 0.3048;
            bmi = (user.weight / (heightInMeters * heightInMeters)).toFixed(1);
        }

        // Fetch Patient Count (For Caretakers)
        // This ensures the counter on the Caretaker Profile is always accurate
        const patientCount = await userModel.countDocuments({ caretakerId: userId });

        res.json({
            success: true,
            userData: {
                name: user.name,
                email: user.email,
                birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : "",
                age: age,
                gender: user.gender,
                primaryLanguage: user.primaryLanguage,
                role: user.role,
                isAccountVerified: user.isAccountVerified,
                
                // Patient Specific Fields
                height: user.height,
                weight: user.weight,
                bmi,
                insuranceProvider: user.insuranceProvider,
                pharmacyNumber: user.pharmacyNumber,
                emergencyContact: user.emergencyContact,

                // Caretaker Specific Fields
                province: user.province,
                city: user.city,
                address: user.address,
                serviceArea: user.serviceArea,
                skills: user.skills,
                
                // The Counter Data
                patients: { length: patientCount } 
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Update User Details (Universal for Patient & Caretaker)
export const updateUserData = async (req, res) => {
    try {
        const { userId, ...updateFields } = req.body;

        // By spreading updateFields, we allow the frontend to send 
        // any field (skills, address, etc.) and it will update automatically.
        const updatedUser = await userModel.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Deactivate Account
export const deactivateAccount = async (req, res) => {
    try {
        const { userId, password } = req.body;
        const user = await userModel.findById(userId);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        await userModel.findByIdAndDelete(userId);
        res.clearCookie('token');
        res.json({ success: true, message: 'Account deactivated' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Create a new patient account and link to caretaker
export const createAndLinkPatient = async (req, res) => {
    try {
        const { 
            userId, name, email, birthday, gender, 
            mobile, primaryLanguage, pharmacyNumber, emergencyContact 
        } = req.body;

        const finalEmail = email || `${name.toLowerCase().replace(/\s/g, '')}${Date.now()}@noemail.com`;

        const newPatient = new userModel({
            name,
            email: finalEmail,
            birthday,
            gender, 
            mobile,
            primaryLanguage,
            pharmacyNumber,
            emergencyContact,
            password: await bcrypt.hash("Temp123!", 10),
            role: 'Patient',
            caretakerId: userId,
            isAccountVerified: true
        });

        await newPatient.save();
        res.json({ success: true, message: "Patient registered successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Add an EXISTING patient to a caretaker's list
export const addPatientToCaretaker = async (req, res) => {
    try {
        const { userId, patientEmail } = req.body;
        const patient = await userModel.findOne({ email: patientEmail, role: 'Patient' });

        if (!patient) {
            return res.json({ success: false, message: "Patient not found" });
        }
        if (patient.caretakerId) {
            return res.json({ success: false, message: "Patient already has a caretaker" });
        }

        patient.caretakerId = userId;
        await patient.save();

        res.json({ success: true, message: "Patient added successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get all patients managed by this caretaker
export const getCaretakerPatients = async (req, res) => {
    try {
        const { userId } = req.body; 
        const patients = await userModel.find({ caretakerId: userId })
            .select('name birthday email pharmacyNumber emergencyContact mobile role gender primaryLanguage');

        res.json({ success: true, patients });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Unlink patient
export const removePatientFromCaretaker = async (req, res) => {
    try {
        const { patientId } = req.body;
        await userModel.findByIdAndUpdate(patientId, { caretakerId: null });
        res.json({ success: true, message: "Patient removed from your list" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get single patient by ID
export const getPatientById = async (req, res) => {
    try {
        // We extract from params: /api/user/get-patient/12345
        const { patientId } = req.params; 
        const patient = await userModel.findById(patientId);
        
        if (!patient) {
            return res.json({ success: false, message: "Patient not found" });
        }

        res.json({ success: true, patient });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update patient details (used by caretaker on patient cards)
export const updatePatient = async (req, res) => {
    try {
        const { _id, ...updateData } = req.body;
        await userModel.findByIdAndUpdate(_id, updateData);
        res.json({ success: true, message: "Updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};