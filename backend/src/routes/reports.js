const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doctors, appointmentStats, completedByDoctor, cancelledByDoctor, todayQueueStats] =
      await Promise.all([
        prisma.doctor.findMany(),
        prisma.appointment.groupBy({ by: ['doctorId'], _count: { id: true } }),
        prisma.appointment.groupBy({
          by: ['doctorId'],
          where: { status: 'COMPLETED' },
          _count: { id: true },
        }),
        prisma.appointment.groupBy({
          by: ['doctorId'],
          where: { status: 'CANCELLED' },
          _count: { id: true },
        }),
        prisma.queueToken.groupBy({
          by: ['doctorId'],
          where: { createdAt: { gte: today } },
          _count: { id: true },
        }),
      ]);

    const totalMap = Object.fromEntries(appointmentStats.map((r) => [r.doctorId, r._count.id]));
    const completedMap = Object.fromEntries(completedByDoctor.map((r) => [r.doctorId, r._count.id]));
    const cancelledMap = Object.fromEntries(cancelledByDoctor.map((r) => [r.doctorId, r._count.id]));
    const queueMap = Object.fromEntries(todayQueueStats.map((r) => [r.doctorId, r._count.id]));

    const reportData = doctors.map((doc) => {
      const completed = completedMap[doc.id] || 0;
      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments: totalMap[doc.id] || 0,
        completedAppointments: completed,
        cancelledAppointments: cancelledMap[doc.id] || 0,
        todayQueueSize: queueMap[doc.id] || 0,
        revenue: completed * doc.consultationFee,
      };
    });

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

module.exports = router;
