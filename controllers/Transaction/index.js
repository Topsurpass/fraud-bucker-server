import prisma from "../../utils/db.js";
import { validateFields } from "../../utils/helpers.js";
import validator from "validator";

export default class TransactionController {
    /**
     * Register new transaction
     * @param {Request} req
     * @param {Response} res
     * @returns JSON
     */

    static async getAllTransactions(req, res) {
        /**
         * Get all transactions with pagination
         */
        try {
            const { page = 1, pageSize = 5 } = req.query;

            const pageNumber = parseInt(page, 10);
            const pageSizeNumber = parseInt(pageSize, 10);

            const skip = (pageNumber - 1) * pageSizeNumber;

            const totalRecords = await prisma.transaction.count();

            const data = await prisma.transaction.findMany({
                skip,
                take: pageSizeNumber,
            });

            return res.status(200).json({
                message: "All fraudulent transactions",
                data,
                pageCount: Math.ceil(totalRecords / pageSizeNumber),
                totalRecords,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving all transactions.",
            });
        }
    }

    static async getTransactionById(req, res) {
        /**
         * Get transaction by Id
         */
        const { id } = req.params;

        try {
            const data = await prisma.transaction.findFirst({
                where: { id: id },
            });
            if (!data) {
                return res.status(404).json({
                    error: "Transaction not found.",
                });
            }
            return res.status(200).json({
                message: "Fraudulent transaction",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving the transaction",
            });
        }
    }

    static async createTransaction(req, res) {
        /**
         * Create or add a new transaction to the DB
         */
        try {
            const { merchantId, amount, type, channelId, analystId, status } = req.body;
            const requiredFields = [
                "merchantId",
                "amount",
                "type",
                "channelId",
                "analystId",
                "status",
            ];

            if (!validateFields(req, res, requiredFields)) {
                return;
            }

            if (!validator.isNumeric(amount.toString())) {
                return res.status(400).json({ error: "Amount should be a valid number" });
            }
            const merchantData = await prisma.merchant.findFirst({
                where: {
                    id: merchantId,
                },
            });

            const analystData = await prisma.user.findFirst({
                where: {
                    id: analystId,
                },
            });

            const channelData = await prisma.channel.findFirst({
                where: {
                    id: channelId,
                },
            });

            if (!merchantData) {
                return res.status(404).json({
                    error: "Merchant does not exist.",
                });
            }

            if (!analystData) {
                return res.status(404).json({
                    error: "Analyst does not exist.",
                });
            }

            if (!channelData) {
                return res.status(404).json({
                    error: "Channel does not exist.",
                });
            }

            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });

            const data = await prisma.transaction.create({
                data: {
                    merchant: merchantData.merchant,
                    merchantId: merchantData.id,
                    amount,
                    type,
                    channelId: channelData.id,
                    channel: channelData.channel,
                    analyst: `${analystData.lastname} ${analystData.firstname}`,
                    analystId: analystData.id,
                    status,
                    date: formattedDate,
                },
            });

            res.status(201).json({
                message: "New fraudulent transaction created",
                data: {
                    transaction: data,
                    merchant: merchantData,
                    analyst: {
                        id: analystData.id,
                        firstname: analystData.firstname,
                        lastname: analystData.lastname,
                        email: analystData.email,
                        phone: analystData.phone,
                        role: analystData.role,
                    },
                    channel: channelData,
                },
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                error: "An error occurred while creating the transaction.",
            });
        }
    }

    static async updateTransaction(req, res) {
        /**
         * Update a particular transaction using its UUID
         */
        const { id } = req.params;
        const { merchantId, amount, type, channelId, analystId, status } = req.body;

        if (!merchantId && !amount && !type && !channelId && !analystId) {
            return res.status(400).json({ error: "No fields provided for update" });
        }

        const updateData = {};

        if (merchantId) {
            const merchantData = await prisma.merchant.findFirst({
                where: {
                    id: merchantId,
                },
            });

            if (!merchantData) {
                return res.status(404).json({ error: "Merchant does not exist." });
            }

            updateData.merchant = merchantData.merchant;
            updateData.merchantId = merchantData.id;
        }

        if (analystId) {
            const analystData = await prisma.user.findFirst({
                where: {
                    id: analystId,
                },
            });

            if (!analystData) {
                return res.status(404).json({ error: "Analyst does not exist." });
            }

            updateData.analyst = `${analystData.lastname} ${analystData.firstname}`;
            updateData.analystId = analystData.id;
        }

        if (channelId) {
            const channelData = await prisma.channel.findFirst({
                where: {
                    id: channelId,
                },
            });

            if (!channelData) {
                return res.status(404).json({ error: "Channel does not exist." });
            }

            updateData.channel = channelData.channel;
            updateData.channelId = channelData.id;
        }

        if (amount) updateData.amount = amount;
        if (type) updateData.type = type;
        if (status) updateData.status = status;

        try {
            const data = await prisma.transaction.update({
                where: { id: id },
                data: updateData,
            });

            res.status(200).json({
                message: "Transaction updated successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Transaction not found" });
            }
            res.status(500).json({
                error: "An error occurred while updating the transaction.",
            });
        }
    }

    static async deleteTransaction(req, res) {
        /**
         * Delete a transaction using its unique ID
         */
        const { id } = req.params;
        try {
            const data = await prisma.transaction.delete({
                where: { id: id },
            });
            return res.status(200).json({
                message: "Transaction deleted successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Transaction not found" });
            }
            return res.status(500).json({
                error: "An error occurred while deleting the transaction.",
            });
        }
    }
}
