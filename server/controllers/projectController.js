import Project from '../models/Project.js';

// GET /api/projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id, isArchived: false })
      .sort({ createdAt: -1 })
      .populate('submissions', 'title language qualityScore createdAt');
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, language } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required.' });
    const project = await Project.create({ userId: req.user._id, name, description, language });
    res.status(201).json({ success: true, message: 'Project created.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects/:id/submissions/:submissionId
export const addSubmissionToProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $addToSet: { submissions: req.params.submissionId } },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
    res.json({ success: true, message: 'Submission added to project.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
