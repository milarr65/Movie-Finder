import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import env from "dotenv";

const app = express();
const port = 3000;
env.config()

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

// Display popular movies on home page
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

// Display popular shows on home page
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

    try {
        const result = await axios.get(base_url + `/search/multi`, {
            params: {
                query: searchQuery,
            },
            headers: api_headers
        });

        res.render("search.ejs", { data: result.data.results });
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// Movie Details
app.get("/details/movie/:id", async (req, res) => {

    try {
        const path = `${base_url}/movie/${req.params.id}`
        const params = {
            append_to_response: "recommendations,keywords,credits,videos,images?language=en"
        }
        const { general_info, recs, directors, keywords, videos, backdrops, posters } = await searchDetailsAPI(path, params, 'movie')

        res.render(`details-movie.ejs`, { info: general_info, recs, keywords, directors, videos, images: [...backdrops, ...posters] })
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// TV Show Details
app.get("/details/tv/:id", async (req, res) => {
    try {
        const path = `${base_url}/tv/${req.params.id}`
        const params = {
            append_to_response: "recommendations,content_ratings,videos,keywords,images?language=en"
        }
        const { general_info, recs, keywords, videos, backdrops, posters } = await searchDetailsAPI(path, params, "tv");

        res.render(`details-tv.ejs`, {
            info: general_info,
            recs,
            keywords,
            videos,
            images: [...backdrops, ...posters]
        })
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
});

// Reduces and formats obects obtained from API to only the necessary items. Returns dict
async function searchDetailsAPI(path, params, media_type) {
    try {
        const api_result = await axios.get(path, {
            params: params,
            headers: api_headers
        })
        const data = api_result.data
        // console.log(data.credits.cast);

        if (media_type === "tv") {
            const general_info = {
                backdrop_path: data.backdrop_path,
                poster_path: data.poster_path,
                name: data.name,
                created_by: data.created_by.map(person => person.name),
                first_air_date: data.first_air_date
                    ? data.first_air_date.split("-")[0]
                    : 'NA', // Year only
                last_air_date: data.last_air_date
                    ? data.last_air_date.split("-")[0]
                    : "NA", // Year only
                genres: data.genres.map(item => item.name),
                networks: data.networks.map(item => item.name),
                episodes: data.number_of_episodes,
                seasons: data.number_of_seasons,
                next_ep: data.next_episode_to_air
                    ? {
                        name: data.next_episode_to_air.name,
                        date: new Date(data.next_episode_to_air.air_date).toLocaleDateString("en-US", {
                            day: 'numeric',
                            year: 'numeric',
                            month: 'short'
                        }),
                        overview: data.next_episode_to_air.overview
                    }
                    : null,
                og_lang: new Intl.DisplayNames(['en'], { type: 'language' }).of(data.original_language),
                og_name: data.original_name,
                overview: data.overview,
                popularity: data.popularity.toFixed(1), // returns str
                status: data.status,
                tagline: data.tagline,
                vote_average: data.vote_average.toFixed(1),
                content_rating: (
                    data.content_ratings?.results?.find(item => item.iso_3166_1 === "US") ||
                    data.content_ratings?.results?.[0] ||
                    {}
                ).rating || null
            }


            const recs = data.recommendations.results.map(item => ({
                poster_path: item.poster_path,
                media_type: item.media_type,
                id: item.id,
                vote_average: item.vote_average.toFixed(1),
                year: item.first_air_date.split("-")[0],
                name: item.name

            }))

            const keywords = data.keywords.results.map(item => item.name)
            const videos = data.videos.results.map(item => ({ site: item.site, key: item.key }))
            const backdrops = data['images?language=en'].backdrops.map(item => item.file_path)
            const posters = data['images?language=en'].posters.map(item => item.file_path)

            const complete_info = { general_info, recs, keywords, videos, backdrops, posters }

            // console.log(complete_info);
            return complete_info


        } else { //movies
            const general_info = {
                backdrop_path: data.backdrop_path,
                poster_path: data.poster_path,
                genres: data.genres.map(item => item.name),
                overview: data.overview,
                popularity: data.popularity.toFixed(1), // returns str,
                release_date: new Date(data.release_date + 'Z').toLocaleDateString("en-US", {
                    day: 'numeric',
                    year: 'numeric',
                    month: 'short'
                }),
                year: data.release_date.split("-")[0],
                runtime: data.runtime.toString() + ' min',
                title: data.title,
                og_title: data.original_title,
                tagline: data.tagline,
                vote_average: data.vote_average.toFixed(1),
                popularity: data.popularity,
                og_lang: new Intl.DisplayNames(['en'], { type: 'language' }).of(data.original_language),
                cast: data.credits.cast?.map(person => person.name)

            }

            const recs = data.recommendations.results.map(item => ({
                poster_path: item.poster_path,
                media_type: item.media_type,
                id: item.id,
                vote_average: item.vote_average.toFixed(1),
                year: item.release_date.split("-")[0],
                title: item.title

            }))

            const directors = data.credits.crew.filter(person => person.job === "Director").map(director => director.name) || "";
            const keywords = data.keywords.keywords.map(item => item.name)
            const videos = data.videos.results.map(item => ({ site: item.site, key: item.key }))
            const backdrops = data['images?language=en'].backdrops.map(item => item.file_path)
            const posters = data['images?language=en'].posters.map(item => item.file_path)

            const complete_info = { general_info, recs, directors, keywords, videos, backdrops, posters }
            // console.log(complete_info);

            return complete_info
        }


    } catch (error) {
        console.log(error);
        throw error

    }
}

app.listen(port, () => {
    console.log(`App running on port ${port}`);
})