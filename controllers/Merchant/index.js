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
            const data = await prisma.merchant.findMany({
                include: {
                    fraudContacts: true,
                    createdBy: true,
                },
            });

            const sanitizedMerchants = data.map(({ createdBy, ...merchant }) => {
                const { password, refreshToken, ...sanitizedCreator } = createdBy || {};

                return {
                    ...merchant,
                    createdBy: sanitizedCreator,
                };
            });

            return res.status(200).json({
                message: "All merchants",
                data: sanitizedMerchants,
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
                include: {
                    transactions: true,
                    fraudContacts: true,
                    createdBy: true,
                },
            });
            if (!data) {
                return res.status(404).json({
                    error: "Merchant not found.",
                });
            }
            const {
                createdBy: { password, refreshToken, ...sanitizedMerchant } = {},
                ...rest
            } = data;

            const sanitizedData = {
                ...rest,
                createdBy: sanitizedMerchant,
            };
            return res.status(200).json({
                message: "Merchant",
                data: sanitizedData,
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
            const { user } = req;
            const { merchantName } = req.body;
            const requiredFields = ["merchantName"];
            if (!validateFields(req, res, requiredFields)) {
                return;
            }
            const existingMerchant = await prisma.merchant.findFirst({
                where: {
                    name: merchantName,
                },
            });
            if (existingMerchant) {
                return res.status(403).json({
                    error: "Merchant with the same name already exist.",
                });
            }

            const data = await prisma.merchant.create({
                data: {
                    name: merchantName,
                    createdById: user.id,
                },
            });
            const creator = await prisma.user.findFirst({
                where: {
                    id: user.id,
                },
            });
            const { password, refreshToken, merchantsCreated, ...userData } = creator;

            res.status(201).json({
                message: "New merchant creaded successfully.",
                data: {
                    id: data.id,
                    name: data.name,
                    createdAt: data.createdAt,
                    createdBy: userData,
                },
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
                where: { name: merchantName },
            });

            if (existingMerchant) {
                return res.status(403).json({
                    error: "Merchant with the same name exist",
                });
            }
            updateData.name = merchantName;
        }

        try {
            const data = await prisma.merchant.update({
                where: { id: id },
                include: {
                    fraudContacts: true,
                    createdBy: true,
                },
                data: updateData,
            });

            const {
                createdBy: { password, refreshToken, ...sanitizedMerchant } = {},
                ...rest
            } = data;

            const sanitizedData = {
                ...rest,
                createdBy: sanitizedMerchant,
            };

            res.status(200).json({
                message: "Merchant updated successfully",
                data: sanitizedData,
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
