import Job from "../models/Job.js";
import User from "../models/User.js";

export const createJob = async (req, res) => {
    try {
        const job = await Job.create({
            ...req.body,
            postedBy: req.user._id,
        });

        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ isActive: true })
            .populate("postedBy", "name username handle profileImage")
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You can only delete your own job posts",
            });
        }

        await job.deleteOne();

        res.json({
            message: "Job deleted",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const toggleSaveJob = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const jobId = req.params.id;

        const alreadySaved = user.savedJobs.some(
            (id) => id.toString() === jobId
        );

        if (alreadySaved) {
            user.savedJobs = user.savedJobs.filter(
                (id) => id.toString() !== jobId
            );
        } else {
            user.savedJobs.push(jobId);
        }

        await user.save();

        res.json(user.savedJobs);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getSavedJobs = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: "savedJobs",
            populate: {
                path: "postedBy",
                select: "name username handle profileImage",
            },
        });

        res.json(user.savedJobs);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};