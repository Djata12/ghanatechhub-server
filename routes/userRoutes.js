import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";
import {
    updateFeaturedProjects,
    updateSkills,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/suggestions/who-to-follow", protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);

        const suggestions = await User.find({
            _id: {
                $ne: req.user._id,
                $nin: currentUser.following,
            },
        })
            .select("-password")
            .limit(5);

        res.json(suggestions);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.get("/trending/developers", protect, async (req, res) => {
    try {
        const users = await User.find({})
            .select("-password")
            .limit(20);

        const developersWithReputation = await Promise.all(
            users.map(async (user) => {
                const allUserPosts = await Post.find({
                    user: user._id,
                });

                let reputation = 0;

                allUserPosts.forEach((post) => {
                    reputation += post.upvotes.length * 5;
                    reputation -= post.downvotes.length * 2;

                    if (post.postType === "post") {
                        reputation += 2;
                    }

                    if (post.postType === "comment") {
                        reputation += 1;
                    }
                });

                

                return {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    handle: user.handle,
                    bio: user.bio,
                    location: user.location,
                    profileImage: user.profileImage,
                    reputation,
                };
            })
        );

        const sortedDevelopers = developersWithReputation
            .sort((a, b) => b.reputation - a.reputation)
            .slice(0, 5);

        res.json(sortedDevelopers);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.get("/search/mentions", protect, async (req, res) => {
    try {
        const query = req.query.q || "";

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { username: { $regex: query, $options: "i" } },
                { handle: { $regex: query, $options: "i" } },
            ],
        })
            .select("name username handle profileImage")
            .limit(8);

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.get("/:username", async (req, res) => {
    try {
        const user = await User.findOne({
            username: req.params.username,
        })
            .select("-password")
            .populate("followers", "name username handle profileImage bio location")
            .populate("following", "name username handle profileImage bio location");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const posts = await Post.find({
            user: user._id,
            postType: { $in: ["post", "quote"] },
        })
            .populate("user", "name username handle profileImage bio location role")
            .populate({
                path: "quotedPost",
                populate: {
                    path: "user",
                    select: "name username handle profileImage bio location role",
                },
            })
            .sort({ createdAt: -1 });

        const comments = await Post.find({
            user: user._id,
            postType: "comment",
        })
            .populate("user", "name username handle profileImage bio location role")
            .populate({
                path: "parentPost",
                populate: {
                    path: "user",
                    select: "name username handle profileImage bio location role",
                },
            })
            .sort({ createdAt: -1 });
            const allUserPosts = await Post.find({
                user: user._id,
            });
            
            let reputation = 0;
            
            allUserPosts.forEach((post) => {
                reputation += post.upvotes.length * 5;
                reputation -= post.downvotes.length * 2;
            
                if (post.postType === "post") {
                    reputation += 2;
                }
            
                if (post.postType === "comment") {
                    reputation += 1;
                }
            });
            
            
            
            res.json({
                user,
                posts,
                comments,
                reputation,
            });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.put("/:id/follow", protect, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user._id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself",
            });
        }

        const targetUser = await User.findById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const currentUser = await User.findById(currentUserId);

        const isFollowing = currentUser.following.some(
            (id) => id.toString() === targetUserId
        );

        if (isFollowing) {
            await User.findByIdAndUpdate(currentUserId, {
                $pull: {
                    following: targetUserId,
                },
            });

            await User.findByIdAndUpdate(targetUserId, {
                $pull: {
                    followers: currentUserId,
                },
            });

            return res.json({
                message: "User unfollowed",
            });
        }

        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: {
                following: targetUserId,
            },
        });

        await User.findByIdAndUpdate(targetUserId, {
            $addToSet: {
                followers: currentUserId,
            },
        });

        const notification = await Notification.create({
            recipient: targetUserId,
            sender: currentUserId,
            type: "follow",
            message: `${req.user.handle} followed you`,
        });
        
        req.app.get("io").to(targetUserId.toString()).emit("new-notification", notification);

        res.json({
            message: "User followed",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.put("/me/update", protect, async (req, res) => {
    try {
        const {
            name,
            bio,
            location,
            profileImage,
            bannerImage,
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (name) {
            user.name = name;
            user.username = name.replace(/\s+/g, "");
            user.handle = `@gth${user.username}`;
        }

        user.bio = bio ?? user.bio;
        user.location = location ?? user.location;
        user.profileImage = profileImage ?? user.profileImage;
        user.bannerImage = bannerImage ?? user.bannerImage;

        await user.save();

        res.json({
            id: user._id,
            name: user.name,
            username: user.username,
            handle: user.handle,
            email: user.email,
            role: user.role,
            bio: user.bio,
            location: user.location,
            profileImage: user.profileImage,
            followers: user.followers,
            following: user.following,
            bannerImage: user.bannerImage,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.put(
    "/featured-projects",
    protect,
    updateFeaturedProjects
);

router.put(
    "/skills",
    protect,
    updateSkills
);

export default router;