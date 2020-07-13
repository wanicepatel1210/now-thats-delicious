const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');
const { Store } = require('express-session');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!',
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: 'point',
    },
    coordinates: [{
      type: Number,
      required: 'You must provide the coordinates.',
    }],
    address: {
      type: String,
      required: 'You must provide an address.',
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must provide an author',
  },
});

storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({
  location: '2dsphere',
});

storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);
  const slufRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storeWIthSlug = await this.constructor.find({slug: slufRegEx});
  if (storeWIthSlug.length) {
    this.slug = `${this.slug}-${storeWIthSlug.length}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // Lookup stores and populate their reviews
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'store',
        as: 'reviews',
      }
    },
    // Filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add average reviews field
    {
      $addFields: { 
        averageRating: { $avg: '$reviews.rating' }
      }
    },
    // Sort it by our new field. highest reviews first
    { $sort: { averageRating: -1 } },
    //limit to at most 10
    { $limit: 10 }
  ]);
};

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'store',
});

function autoPopulate(next) {
  this.populate('reviews');
  next();
}
storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);