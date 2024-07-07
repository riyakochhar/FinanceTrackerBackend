const express = require("express");
const userModel = require("../models/UserModel");
const transactionModel = require("../models/TransactionModel");
const router = express.Router();

const getNSlot = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
};

router.post("/transactions", async (req, res) => {
  try {
    const { userId, ...transactionData } = req.body;
    const newTransaction = new transactionModel({
      ...transactionData,
      user: userId,
      nSlot: getNSlot(transactionData.date),
    });
    await newTransaction.save();

    // Add the transaction to the user's transactions array
    const user = await userModel.findById(userId);
    user.transactions.push(newTransaction._id);
    await user.save();

    res.status(201).json({ success: true, transaction: newTransaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { from_slot, to_slot } = req.query;
    const user = await userModel.findById(userId).populate("transactions");
    if (from_slot && to_slot) {
      const filtered_transactions = user.transactions.filter((item) => {
        return item.nSlot >= from_slot && item.nSlot <= to_slot;
      });
      return res
        .status(200)
        .json({ success: true, transactions: filtered_transactions });
    }
    res.status(200).json({ success: true, transactions: user.transactions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
