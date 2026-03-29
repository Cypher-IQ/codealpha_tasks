const { Board } = require('../models');

// @desc    Create a board for a project
// @route   POST /api/projects/:projectId/boards
// @access  Private (Owner/Admin)
const createBoard = async (req, res, next) => {
  try {
    const { name, columns } = req.body;
    const project = req.project;

    const initialColumns = columns && columns.length > 0 
      ? columns 
      : [
          { _id: 'col_1', name: 'To Do', order: 0 },
          { _id: 'col_2', name: 'In Progress', order: 1 },
          { _id: 'col_3', name: 'Done', order: 2 }
        ];

    const board = await Board.create({
      projectId: project.id,
      name,
      columns: initialColumns
    });

    const j = board.toJSON();
    j._id = j.id;
    res.status(201).json(j);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all boards for a project
// @route   GET /api/projects/:projectId/boards
// @access  Private (Owner/Admin/Member)
const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.findAll({ where: { projectId: req.params.projectId }});
    
    const formatted = boards.map(b => {
        const j = b.toJSON();
        j._id = j.id;
        return j;
    });

    res.status(200).json(formatted);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a board (including its columns)
// @route   PUT /api/projects/:projectId/boards/:boardId
// @access  Private (Owner/Admin)
const updateBoard = async (req, res, next) => {
  try {
    const { name, columns } = req.body;
    let board = await Board.findOne({ where: { id: req.params.boardId, projectId: req.params.projectId } });

    if (!board) return res.status(404).json({ message: 'Board not found' });

    if (name) board.name = name;
    if (columns) board.columns = columns;

    await board.save();
    
    const j = board.toJSON();
    j._id = j.id;
    res.status(200).json(j);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBoard,
  getBoards,
  updateBoard
};
