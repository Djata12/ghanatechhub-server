import Developer from "../models/Developer.js";

export const getDevelopers = async (req, res) => {
    try {
        const developers = await Developer.find();

        res.status(200).json(developers);
    } catch (error) {
        res.status(500).json({
        message: error.message,
        });
    }
};