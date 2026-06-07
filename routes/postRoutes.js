import express from "express";

import {
    createPost,
    getPosts,
    createComment,
    getComments,
    createQuote,
    deletePost,
    toggleFavorite,
    toggleBookmark,
    toggleReshare,
    getMyReshares,
    toggleUpvote,
    toggleDownvote,
    getMyBookmarks,
    getTrendingHashtags,
} from "../controllers/postController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/trending/hashtags", getTrendingHashtags);
router.get("/my-reshares", protect, getMyReshares);
router.get("/my-bookmarks", protect, getMyBookmarks);

router.post("/", protect, createPost);
router.post("/:id/comment", protect, createComment);
router.get("/:id/comments", getComments);

router.post("/:id/quote", protect, createQuote);
router.delete("/:id", protect, deletePost);

router.put("/:id/favorite", protect, toggleFavorite);
router.put("/:id/bookmark", protect, toggleBookmark);
router.put("/:id/reshare", protect, toggleReshare);
router.put("/:id/upvote", protect, toggleUpvote);
router.put("/:id/downvote", protect, toggleDownvote);

export default router;