import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const devToResponse = await fetch(
            "https://dev.to/api/articles?tag=technology&per_page=10"
        );

        const devToNews = await devToResponse.json();

        const hackerNewsResponse = await fetch(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
        );

        const storyIds = await hackerNewsResponse.json();

        const topStories = await Promise.all(
            storyIds.slice(0, 10).map(async (id) => {
                const storyResponse = await fetch(
                    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
                );

                return storyResponse.json();
            })
        );

        res.json({
            devTo: devToNews,
            hackerNews: topStories,
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch tech news",
            error: error.message,
        });
    }
});

export default router;