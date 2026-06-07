import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const populatePost = async (postId) => {
    return await Post.findById(postId)
        .populate("user", "name username handle profileImage bio location role")
        .populate("quotedPost")
        .populate({
            path: "quotedPost",
            populate: {
                path: "user",
                select: "name username handle profileImage bio location role",
            },
        });
};

const emitNotification = (req, recipientId, notification) => {
    req.app
        .get("io")
        .to(recipientId.toString())
        .emit("new-notification", notification);
};

const handleMentions = async (content, sender, postId, req) => {
    const mentionRegex = /@gth[A-Za-z0-9_]+/g;
    const mentions = content.match(mentionRegex) || [];

    for (const handle of mentions) {
        const mentionedUser = await User.findOne({ handle });

        if (
            mentionedUser &&
            mentionedUser._id.toString() !== sender._id.toString()
        ) {
            const notification = await Notification.create({
                recipient: mentionedUser._id,
                sender: sender._id,
                post: postId,
                type: "mention",
                message: `${sender.handle} mentioned you in a discussion`,
            });

            emitNotification(req, mentionedUser._id, notification);
        }
    }
};

export const createPost = async (req, res) => {
    try {
        const post = await Post.create({
            user: req.user._id,
            content: req.body.content,
            postType: "post",
        });

        await handleMentions(req.body.content, req.user, post._id, req);

        const populatedPost = await populatePost(post._id);

        res.status(201).json(populatedPost);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getPosts = async (req, res) => {
    try {
        const posts = await Post.find({ postType: { $in: ["post", "quote"] } })
            .populate("user", "name username handle profileImage bio location role")
            .populate({
                path: "quotedPost",
                populate: {
                    path: "user",
                    select: "name username handle profileImage bio location role",
                },
            })
            .sort({ createdAt: -1 });

        const postsWithCommentCount = await Promise.all(
            posts.map(async (post) => {
                const commentsCount = await Post.countDocuments({
                    parentPost: post._id,
                    postType: "comment",
                });

                return {
                    ...post.toObject(),
                    commentsCount,
                };
            })
        );

        res.json(postsWithCommentCount);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const createComment = async (req, res) => {
    try {
        const parentPost = await Post.findById(req.params.id).populate("user");

        if (!parentPost) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const comment = await Post.create({
            user: req.user._id,
            content: req.body.content,
            parentPost: parentPost._id,
            postType: "comment",
        });

        if (parentPost.user._id.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: parentPost.user._id,
                sender: req.user._id,
                post: parentPost._id,
                type: "comment",
                message: `${req.user.handle} replied to your discussion`,
            });

            emitNotification(req, parentPost.user._id, notification);
        }

        await handleMentions(req.body.content, req.user, comment._id, req);

        const populatedComment = await populatePost(comment._id);

        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getComments = async (req, res) => {
    try {
        const comments = await Post.find({
            parentPost: req.params.id,
            postType: "comment",
        })
            .populate("user", "name username handle profileImage bio location role")
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const createQuote = async (req, res) => {
    try {
        const originalPost = await Post.findById(req.params.id).populate("user");

        if (!originalPost) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const quote = await Post.create({
            user: req.user._id,
            content: req.body.content,
            quotedPost: originalPost._id,
            postType: "quote",
        });

        if (originalPost.user._id.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: originalPost.user._id,
                sender: req.user._id,
                post: originalPost._id,
                type: "quote",
                message: `${req.user.handle} quoted your discussion`,
            });

            emitNotification(req, originalPost.user._id, notification);
        }

        await handleMentions(req.body.content, req.user, quote._id, req);

        const populatedQuote = await populatePost(quote._id);

        res.status(201).json(populatedQuote);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: "Not authorized to delete this discussion",
            });
        }

        await post.deleteOne();

        res.json({
            message: "Discussion deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const toggleFavorite = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("user");

        if (!post) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const userId = req.user._id.toString();

        const alreadyFavorited = post.favorites.some(
            (id) => id.toString() === userId
        );

        if (alreadyFavorited) {
            post.favorites = post.favorites.filter(
                (id) => id.toString() !== userId
            );
        } else {
            post.favorites.push(req.user._id);

            if (post.user._id.toString() !== req.user._id.toString()) {
                const notification = await Notification.create({
                    recipient: post.user._id,
                    sender: req.user._id,
                    post: post._id,
                    type: "favorite",
                    message: `${req.user.handle} favorited your discussion`,
                });

                emitNotification(req, post.user._id, notification);
            }
        }

        await post.save();

        const updatedPost = await populatePost(post._id);

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const toggleBookmark = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const userId = req.user._id.toString();

        const alreadyBookmarked = post.bookmarks.some(
            (id) => id.toString() === userId
        );

        if (alreadyBookmarked) {
            post.bookmarks = post.bookmarks.filter(
                (id) => id.toString() !== userId
            );
        } else {
            post.bookmarks.push(req.user._id);
        }

        await post.save();

        const updatedPost = await populatePost(post._id);

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const toggleReshare = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("user");

        if (!post) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const userId = req.user._id.toString();

        const alreadyReshared = post.reshares.some(
            (id) => id.toString() === userId
        );

        if (alreadyReshared) {
            post.reshares = post.reshares.filter(
                (id) => id.toString() !== userId
            );
        } else {
            post.reshares.push(req.user._id);

            if (post.user._id.toString() !== req.user._id.toString()) {
                const notification = await Notification.create({
                    recipient: post.user._id,
                    sender: req.user._id,
                    post: post._id,
                    type: "reshare",
                    message: `${req.user.handle} reshared your discussion`,
                });

                emitNotification(req, post.user._id, notification);
            }
        }

        await post.save();

        const updatedPost = await populatePost(post._id);

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getMyReshares = async (req, res) => {
    try {
        const posts = await Post.find({
            reshares: req.user._id,
        })
            .populate("user", "name username handle profileImage bio location role")
            .sort({ updatedAt: -1 });

        res.json(posts);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const toggleUpvote = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const userId = req.user._id.toString();

        const alreadyUpvoted = post.upvotes.some(
            (id) => id.toString() === userId
        );

        if (alreadyUpvoted) {
            post.upvotes = post.upvotes.filter(
                (id) => id.toString() !== userId
            );
        } else {
            post.upvotes.push(req.user._id);

            post.downvotes = post.downvotes.filter(
                (id) => id.toString() !== userId
            );
        }

        await post.save();

        const updatedPost = await populatePost(post._id);

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const toggleDownvote = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Discussion not found",
            });
        }

        const userId = req.user._id.toString();

        const alreadyDownvoted = post.downvotes.some(
            (id) => id.toString() === userId
        );

        if (alreadyDownvoted) {
            post.downvotes = post.downvotes.filter(
                (id) => id.toString() !== userId
            );
        } else {
            post.downvotes.push(req.user._id);

            post.upvotes = post.upvotes.filter(
                (id) => id.toString() !== userId
            );
        }

        await post.save();

        const updatedPost = await populatePost(post._id);

        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getMyBookmarks = async (req, res) => {
    try {
        const posts = await Post.find({
            bookmarks: req.user._id,
        })
            .populate("user", "name username handle profileImage bio location role")
            .populate({
                path: "quotedPost",
                populate: {
                    path: "user",
                    select: "name username handle profileImage bio location role",
                },
            })
            .sort({ updatedAt: -1 });

        res.json(posts);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

export const getTrendingHashtags = async (req, res) => {
    try {
        const posts = await Post.find({
            content: { $regex: /#[a-zA-Z0-9_]+/ },
        });

        const tagCounts = {};

        posts.forEach((post) => {
            const tags = post.content.match(/#[a-zA-Z0-9_]+/g) || [];

            tags.forEach((tag) => {
                const cleanTag = tag.toLowerCase();

                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
            });
        });

        const trendingTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({
                tag,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        res.json(trendingTags);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};