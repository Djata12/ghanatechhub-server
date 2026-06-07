import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";

export const applyForJob = async (req, res) => {
    try {
        const { coverLetter } = req.body;

        const alreadyApplied = await Application.findOne({
            job: req.params.jobId,
            applicant: req.user._id,
        });

        if (alreadyApplied) {
            return res.status(400).json({
                message: "You have already applied for this job",
            });
        }

        const application = await Application.create({
            job: req.params.jobId,
            applicant: req.user._id,
            coverLetter,
        });
        
        const job = await Job.findById(req.params.jobId);

    if (job && job.postedBy.toString() !== req.user._id.toString()) {
        await Notification.create({
            recipient: job.postedBy,
            sender: req.user._id,
            type: "message",
            message: `${req.user.name} applied for your job: ${job.title}`,
        });

        const io = req.app.get("io");

        io.to(job.postedBy.toString()).emit("new-notification");
    }

            res.status(201).json(application);
        } catch (error) {
            res.status(500).json({
                message: error.message,
            });
        }
    };

export const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            applicant: req.user._id,
        })
            .populate({
                path: "job",
                populate: {
                    path: "postedBy",
                    select: "name username handle profileImage",
                },
            })
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getApplicantsForMyJobs = async (req, res) => {
    try {
        const myJobs = await Job.find({
            postedBy: req.user._id,
        });

        const jobIds = myJobs.map((job) => job._id);

        const applications = await Application.find({
            job: { $in: jobIds },
        })
            .populate("applicant", "name username handle profileImage email role location")
            .populate("job", "title company location jobType salary")
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const application = await Application.findById(req.params.id)
            .populate("job");

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
            });
        }

        if (
            application.job.postedBy.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You can only update applications for your own jobs",
            });
        }

        application.status = status;

        await application.save();

        await Notification.create({
            recipient: application.applicant,
            sender: req.user._id,
            type: "message",
            message: `Your application for ${application.job.title} is now ${status}`,
        });

        const io = req.app.get("io");

        if (io) {
            io.to(application.applicant.toString())
                .emit("new-notification");
        }

        res.json(application);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const updateRecruiterNotes = async (req, res) => {
    try {
        const { recruiterNotes } = req.body;

        const application = await Application.findById(req.params.id).populate("job");

        if (!application) {
            return res.status(404).json({
                message: "Application not found",
            });
        }

        if (application.job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You can only update notes for your own jobs",
            });
        }

        application.recruiterNotes = recruiterNotes;

        await application.save();

        res.json(application);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};