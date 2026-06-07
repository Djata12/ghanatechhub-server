import express from "express";
import Developer from "../models/Developer.js";

const router = express.Router();



// GET ALL DEVELOPERS

router.get("/", async (req, res) => {

    try {

        const developers = await Developer.find();

        res.json(developers);

    }  catch (error) {
        console.log("CREATE DEVELOPER ERROR:", error);
    
        res.status(500).json({
            message: error.message,
            name: error.name,
        });
    }

});



// CREATE DEVELOPER

router.post("/", async (req, res) => {

    try {

        const developer = await Developer.create(req.body);

        res.status(201).json(developer);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});

export default router;