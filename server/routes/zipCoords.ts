import express from 'express'
import zipcodes from 'zipcodes'
import { sendError } from '../lib/errors.js'

export const zipCoordsRouter = express.Router()

zipCoordsRouter.get('/:zip', (req, res) => {
  const zip = String(req.params.zip ?? '').replace(/\D/g, '').slice(0, 5)
  if (zip.length !== 5) {
    return sendError(res, 400, 'Invalid ZIP code.')
  }

  const record = zipcodes.lookup(zip)
  if (!record) {
    return sendError(res, 404, 'ZIP code not found.')
  }

  return res.json({
    zip: record.zip,
    lat: record.latitude,
    lng: record.longitude,
    city: record.city,
    state: record.state,
  })
})
