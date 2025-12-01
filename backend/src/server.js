import express from "express";


const app =  express();




app.get("/api/health", (req, res) => {
    res.status(200).json({message : "Just checking the health of the server : )"})
});



app.listen(3000, () => {
    console.log("Server is up and running");
});


