import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import env from "dotenv";

const app = express();
const port = 3000;
env.config()

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_TOKEN = process.env.TMDB_API_TOKEN;
const base_url = "https://api.themoviedb.org/3"
const api_headers = {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_API_TOKEN}`,
};

app.set('view engine', 'ejs')
app.set('views', './views');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Home page with popular media
app.get("/", async (req, res) => {

    try {
        // Get timeframe from query params (default to 'week')
        const timeframe = req.query.timeframe || "week";
        const result = await axios.get(`${base_url}/trending/all/${timeframe}`, {
            headers: api_headers
        });
        //console.log(`API URL: ${base_url}/trending/all/${timeframe}`);

        res.render("index", { data: result.data.results, selectedTimeframe: timeframe, page: "no" });


    } catch (error) {
        console.log(error);
        res.status(500).send("Error " + error.message);
    }
});

//display popular movies on home page
app.get("/movies", async (req, res) => {

    try {
        // Get timeframe from query params (default to 'week')
        const timeframe = req.query.timeframe || "week";
        const result = await axios.get(`${base_url}/trending/movie/${timeframe}`, {
            headers: api_headers
        });

        res.render("index", {
            data: result.data.results,
            selectedTimeframe: timeframe,
            page: "movies"
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error " + error.message);
    }
});

//Display popular shows on home page
app.get("/shows", async (req, res) => {

    try {
        // Get timeframe from query params (default to 'week')
        const timeframe = req.query.timeframe || "week";
        const result = await axios.get(`${base_url}/trending/tv/${timeframe}`, {
            headers: api_headers
        });

        res.render("index", { data: result.data.results, selectedTimeframe: timeframe, page: "shows" });

    } catch (error) {
        console.log(error);
        res.status(500).send("Error " + error.message);
    }
});

// Search multiple media
app.get("/search", async (req, res) => {
    const searchQuery = req.query.q;
    //console.log(searchQuery);
    try {
        const result = await axios.get(base_url + `/search/multi`, {
            params: {
                query: searchQuery,
            },
            headers: api_headers
        });
        // console.log(`Total Results: ${result.data.results.length}`);
        res.render("search.ejs", { data: result.data.results });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// Movie Details
app.get("/details/movie/:id", async (req, res) => {

    try {
        const result = await axios.get(base_url + `/movie/${req.params.id}`, {
            params: {
                append_to_response: "credits,recommendations,videos,keywords,images?include_image_language=en"
            },
            headers: api_headers
        });
        //console.log(result.data);

        const myData = {
            data: result.data,
            similar: result.data.recommendations.results,
            videos: result.data.videos.results,
            keywords: result.data.keywords.keywords,
            credits: result.data.credits.crew,
            images: [
                ...(result.data["images?include_image_language=en"]?.backdrops || []),
                ...(result.data["images?include_image_language=en"]?.posters || [])
            ] // Combine backdrops & posters
        }

        res.render(`details-movie.ejs`, myData)
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

//TV Show Details
app.get("/details/tv/:id", async (req, res) => {
    try {
        const result = await axios.get(base_url + `/tv/${req.params.id}`, {
            params: {
                append_to_response: "recommendations,content_ratings,videos,keywords,images?include_image_language=en"
            },
            headers: api_headers
        });
        //console.log(result.data);

        const myData = {
            data: result.data,
            content_ratings: result.data.content_ratings.results,
            similar: result.data.recommendations.results,
            videos: result.data.videos.results,
            keywords: result.data.keywords.results,
            images: [
                ...(result.data["images?include_image_language=en"]?.backdrops || []),
                ...(result.data["images?include_image_language=en"]?.posters || [])
            ] // Combine backdrops & posters
        }
        res.render(`details-tv.ejs`, myData)
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
})