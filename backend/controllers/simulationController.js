import Simulation from "../models/simulationModel.js";

// Create a simulation for the authenticated user
export const createSimulation = async (req, res) => {
  try {
    const userid = req.user?.id;
    if (!userid) return res.status(403).json({ message: "Unauthorized" });
    const { title, parts, estimated_price } = req.body;
    const sim = await Simulation.create({ userid, title, parts, estimated_price });
    res.status(201).json(sim);
  } catch (e) {
    res.status(500).json({ message: "Failed to create simulation" });
  }
};

export const listMySimulations = async (req, res) => {
  try {
    const userid = req.user?.id;
    if (!userid) return res.status(403).json({ message: "Unauthorized" });
    const sims = await Simulation.findAll({ where: { userid } });
    res.json(sims);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch simulations" });
  }
};

export const getMySimulation = async (req, res) => {
  try {
    const userid = req.user?.id;
    const sim = await Simulation.findByPk(req.params.id);
    if (!sim || sim.userid !== userid) return res.status(404).json({ message: "Not found" });
    res.json(sim);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch simulation" });
  }
};

export const updateMySimulation = async (req, res) => {
  try {
    const userid = req.user?.id;
    const sim = await Simulation.findByPk(req.params.id);
    if (!sim || sim.userid !== userid) return res.status(404).json({ message: "Not found" });
    await sim.update(req.body);
    res.json(sim);
  } catch (e) {
    res.status(500).json({ message: "Failed to update simulation" });
  }
};

export const deleteMySimulation = async (req, res) => {
  try {
    const userid = req.user?.id;
    const sim = await Simulation.findByPk(req.params.id);
    if (!sim || sim.userid !== userid) return res.status(404).json({ message: "Not found" });
    await sim.destroy();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete simulation" });
  }
};

