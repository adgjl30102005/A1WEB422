const express = require("express");
const cors = require("cors");
require("dotenv").config();
const dataService = require("./data-service");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API Listening",
    term: "Winter 2026",
    student: "Thien Phuc Ngo",
    learnID: "115294233"
  });
});

app.post("/api/sites", async (req, res) => {
  try {
    const newSite = await dataService.addNewSite(req.body);
    res.status(201).json(newSite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/sites", async (req, res) => {
  const { page, perPage, name, description, year, town, provinceOrTerritoryCode } = req.query;

  if (!page || !perPage) {
    return res.status(400).json({ message: "page and perPage are required" });
  }

  try {
    const sites = await dataService.getAllSites(
      parseInt(page),
      parseInt(perPage),
      name,
      description,
      year ? parseInt(year) : undefined,
      town,
      provinceOrTerritoryCode
    );

    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/sites/:id", async (req, res) => {
  try {
    const site = await dataService.getSiteById(req.params.id);

    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }

    res.json(site);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/sites/:id", async (req, res) => {
  try {
    await dataService.updateSiteById(req.body, req.params.id);
    res.json({ message: "Site updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/sites/:id", async (req, res) => {
  try {
    await dataService.deleteSiteById(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

dataService.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`Server listening on: ${HTTP_PORT}`);
  });
}).catch((err) => {
  console.log(err);
});
