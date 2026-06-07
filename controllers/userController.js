import User from "../models/User.js";

export const updateFeaturedProjects = async (req, res) => {
    try {
        const { featuredProjects } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        user.featuredProjects = featuredProjects;

        await user.save();

        res.json(user.featuredProjects);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const updateSkills = async (req, res) => {
    try {
        const { skills } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        user.skills = skills;

        await user.save();

        res.json(user.skills);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};