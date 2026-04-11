const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const jwt = require("jsonwebtoken");

const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

const userService = require("./user-service.js");
const dataService = require("./data-service.js");

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

const opts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme("jwt"),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JWTStrategy(opts, (jwt_payload, done) => {
    return done(null, jwt_payload);
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "A3 – Secured API Listening",
    term: "Winter 2026",
    student: "Thien Phuc Ngo",
    learnID: "115294233"
  });
});

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then(msg => res.json({ message: msg }))
    .catch(msg => res.status(422).json({ message: msg }));
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then(user => {
      const payload = {
        _id: user._id,
        userName: user.userName
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET);

      res.json({
        message: "login successful",
        token
      });
    })
    .catch(msg => res.status(422).json({ message: msg }));
});

app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then(data => res.json(data))
      .catch(err => res.status(422).json({ error: err }));
  }
);

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then(data => res.json(data))
      .catch(err => res.status(422).json({ error: err }));
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then(data => res.json(data))
      .catch(err => res.status(422).json({ error: err }));
  }
);

app.get("/api/sites", async (req, res) => {
  try {
    const {
      page,
      perPage,
      name,
      description,
      year,
      town,
      provinceOrTerritoryCode
    } = req.query;

    if (!page || !perPage) {
      return res.status(400).json({ message: "page and perPage are required" });
    }

    const data = await dataService.getAllSites(
      parseInt(page),
      parseInt(perPage),
      name,
      description,
      year ? parseInt(year) : undefined,
      town,
      provinceOrTerritoryCode
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/sites/:id", async (req, res) => {
  try {
    const site = await dataService.getSiteById(req.params.id);

    if (!site) return res.status(404).json({ message: "Site not found" });

    res.json(site);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post(
  "/api/sites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const newSite = await dataService.addNewSite(req.body);
      res.status(201).json(newSite);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.put(
  "/api/sites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await dataService.updateSiteById(req.body, req.params.id);
      res.json({ message: "Site updated successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.delete(
  "/api/sites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await dataService.deleteSiteById(req.params.id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

userService
  .connect()
  .then(() => dataService.initialize())
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch(err => {
    console.log(err);
    process.exit();
  });