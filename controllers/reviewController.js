const mongoose = require('mongoose');
const Review = require('../models/Review');

exports.addReview = async (req, res) => {
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  //req.body.created = new Date();
  
  const newReview = new Review(req.body);
  await newReview.save();
  req.flash('success', 'Review saved!');
  res.redirect('back');
};
