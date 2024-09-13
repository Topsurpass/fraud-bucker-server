import prisma from "../../utils/db.js";
import { validateFields } from "../../utils/helpers.js";

export default class MerchantController {
    /**
     * Register new transaction
     * @param {Request} req
     * @param {Response} res
     * @returns JSON
     */
    static async getAllMerchant(_, res) {
        try {
            const data = await prisma.merchant.findMany();
            return res.status(200).json({
                message: "All merchants",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving all merchants.",
            });
        }
    }

    static async getMerchantById(req, res) {
        const { id } = req.params;

        try {
            const data = await prisma.merchant.findFirst({
                where: { id: id },
            });
            if (!data) {
                return res.status(404).json({
                    error: "Merchant not found.",
                });
            }
            return res.status(200).json({
                message: "Merchant",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving the merchant",
            });
        }
    }

    static async createMerchant(req, res) {
        /**
         * Create new merchant
         */

        try {
            const { merchantName } = req.body;
            const requiredFields = ["merchantName"];
            if (!validateFields(req, res, requiredFields)) {
                return;
            }
            const existingMerchant = await prisma.merchant.findFirst({
                where: {
                    merchant: merchantName,
                },
            });
            if (existingMerchant) {
                return res.status(403).json({
                    error: "Merchant with the same name already exist.",
                });
            }
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            const data = await prisma.merchant.create({
                data: {
                    merchant: merchantName,
                    date: formattedDate,
                },
            });
            res.status(201).json({
                message: "New merchant creaded successfully.",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while creating the merchant.",
            });
        }
    }

    static async updateMerchant(req, res) {
        /**
         * Update a particular merchant using it UUID
         */
        const { id } = req.params;
        const { merchantName } = req.body;

        if (!merchantName) {
            return res.status(400).json({ error: "No field provided for update" });
        }

        const updateData = {};

        if (merchantName) {
            const existingMerchant = await prisma.merchant.findFirst({
                where: { merchant: merchantName },
            });

            if (existingMerchant) {
                return res.status(403).json({
                    error: "Merchant with the same name exist",
                });
            }
            updateData.merchant = merchantName;
        }

        try {
            const data = await prisma.merchant.update({
                where: { id: id },
                data: updateData,
            });

            res.status(200).json({
                message: "Merchant updated successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Merchant not found" });
            }
            return res
                .status(500)
                .json({ error: "An error occurred while updating the merchant." });
        }
    }

    static async deleteMerchant(req, res) {
        /**
         * Delete a particular merchant
         */
        const { id } = req.params;
        try {
            const data = await prisma.merchant.delete({
                where: { id: id },
            });

            res.status(200).json({
                message: "Merchant deleted successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Merchant not found" });
            }
            return res
                .status(500)
                .json({ error: "An error occurred while deleting the merchant." });
        }
    }
}
