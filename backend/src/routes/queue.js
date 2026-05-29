const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { doctorId, status } = req.query;
    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const tokens = await prisma.queueToken.findMany({
      where,
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tokens);
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve queue.' });
  }
});

router.post('/checkin', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ error: 'Patient and Doctor ID are required for check-in.' });
    }

    const newToken = await prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxResult = await tx.queueToken.aggregate({
        where: { doctorId, createdAt: { gte: today } },
        _max: { tokenNumber: true },
      });

      const nextTokenNumber = (maxResult._max.tokenNumber || 0) + 1;

      return tx.queueToken.create({
        data: {
          tokenNumber: nextTokenNumber,
          patientId,
          doctorId,
          appointmentId: appointmentId || null,
          status: 'WAITING',
        },
        include: { patient: true, doctor: true },
      });
    }, { isolationLevel: 'Serializable' });

    res.status(201).json({ message: 'Checked in successfully. Token generated.', token: newToken });
  } catch (error) {
    console.error('Queue check-in error:', error);
    res.status(500).json({ error: 'Check-in failed. Please try again.' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['WAITING', 'CALLING', 'COMPLETED', 'SKIPPED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const updatedToken = await prisma.queueToken.update({
      where: { id: req.params.id },
      data: { status },
      include: { patient: true, doctor: true },
    });

    res.json(updatedToken);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update queue token.' });
  }
});

module.exports = router;
