const mongoose = require('mongoose')
const Schema = mongoose.Schema
const MongooseTrigger = require('./../../src')

const userSchema = new Schema({
  name: String,
  email: String,
  skills: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
    },
  ],
})

const skillSchema = new Schema({
  name: String,
  usefull: Boolean,
})

let UserEvents = MongooseTrigger(userSchema, {
  events: {
    create: {
      select: 'email skills',
      populate: {
        path: 'skills',
        select: 'name',
      },
    },
    update: {
      populate: 'skills',
    },
    remove: true,
  },
  partials: [
    {
      eventName: 'x',
      triggers: 'name',
      select: 'name email skills',
      populate: 'skills',
    },
    {
      eventName: 'skills',
      triggers: 'skills',
      select: 'skills.usefull',
    },
    {
      eventName: 'FunctionTrial',
      triggers: doc => {
        let orArray = doc.skills.map(skill => ({
          _id: skill,
        }))
        let query = { $or: orArray }
        return mongoose
          .model('Skill')
          .find(query)
          .then(skills => skills.some(skill => skill.usefull === true))
      },
      select: 'name skills',
      populate: 'skills',
    },
  ],
  debug: true,
})

UserEvents.on('create', data => console.log('[create] says:', data))
UserEvents.on('update', data => console.log('[update] says:', data))
UserEvents.on('partial:skills', data => console.log('[partial:skills] says:', data))
UserEvents.on('partial:x', data => console.log('[partial:x] says:', data))
UserEvents.on('partial:FunctionTrial', data => console.log('[partial:FunctionTrial] says:', data))
UserEvents.on('remove', data => console.log('[remove] says:', data))

module.exports = {
  User: mongoose.model('User', userSchema),
  Skill: mongoose.model('Skill', skillSchema),
}
