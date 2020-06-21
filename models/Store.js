const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');
const { Store } = require('express-session');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'point'
    },
    coordinates: [{
      type: Number,
      required: 'You must provide the coordinates.'
    }],
    address: {
      type: String,
      required: 'You must provide an address.'
    }
  },
  photo: String
});

storeSchema.pre('save', async function(next) {
  if(!this.isModified('name')) {
    return next();
  }
  this.slug = slug(this.name);
  const slufRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storeWIthSlug = await this.constructor.find({slug: slufRegEx});
  if(storeWIthSlug.length) {
    this.slug = `${this.slug}-${storeWIthSlug.length}`;
  }
  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    {$unwind: '$tags'},
    {$group: {_id: '$tags', count: {$sum: 1}}},
    {$sort: {count: -1}}
  ]);
}

module.exports = mongoose.model('Store', storeSchema);