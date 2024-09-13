import prisma from "../../utils/db.js";

export default class DashboardController {
    static async getTransactionStatistics(_, res) {
        try {
            const countFraudulentTransactions = await prisma.transaction.count({
                where: {
                    status: "Fraudulent",
                },
            });

            const countEscalatedTransactions = await prisma.transaction.count({
                where: {
                    status: "Escalated",
                },
            });

            const countNotFraudTransactions = await prisma.transaction.count({
                where: {
                    status: "Not Fraudulent",
                },
            });

            const sumFraudulentTransaction = await prisma.transaction.aggregate({
                where: {
                    status: "Fraudulent",
                },
                _sum: {
                    amount: true,
                },
            });

            const sumEscalatedTransaction = await prisma.transaction.aggregate({
                where: {
                    status: "Escalated",
                },
                _sum: {
                    amount: true,
                },
            });

            return res.status(200).json({
                message: "Transaction statistics",
                data: {
                    totalFraudulentCount: countFraudulentTransactions || 0,
                    totalEscalateCount: countEscalatedTransactions || 0,
                    totalNotFraudlentCount: countNotFraudTransactions || 0,
                    totalFraudulentAmount: sumFraudulentTransaction._sum.amount || 0,
                    totalEscalatedAmount: sumEscalatedTransaction._sum.amount || 0,
                },
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving transaction statistics.",
            });
        }
    }

    static async getAnalystRank(_, res) {
        try {
            const countAnalystPerformance = await prisma.transaction.groupBy({
                by: ["analyst"],
                _count: {
                    analyst: true,
                },

                where: {
                    status: "Fraudulent",
                },
                orderBy: {
                    _count: {
                        analyst: "desc",
                    },
                },
            });
            const transformedData = countAnalystPerformance.map((item) => ({
                analyst: item.analyst,
                count: item._count.analyst,
            }));

            return res.status(200).json({
                message: "Analyst ranking by number of fraudulent transactions",
                data: transformedData,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving analyst performance ranking.",
            });
        }
    }

    static async getMerchantRank(_, res) {
        try {
            const countFraudByMerchant = await prisma.transaction.groupBy({
                by: ["merchant"],
                _sum: {
                    amount: true,
                },
                _count: {
                    id: true,
                },
                where: {
                    status: "Fraudulent",
                },
                orderBy: {
                    _sum: {
                        amount: "desc",
                    },
                },
                take: 5,
            });
            const transformedData = countFraudByMerchant.map((item) => ({
                merchant: item.merchant,
                cases: item._count.id,
                amount: item._sum.amount,
            }));

            return res.status(200).json({
                message: "Merchant ranking by amount of fraudulent transactions",
                data: transformedData,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving merchant fraudulent transactions.",
            });
        }
    }

    static async getRecentFraudTransaction(_, res) {
        try {
            const recentTransaction = await prisma.transaction.findMany({
                where: {
                    status: "Fraudulent",
                },
                orderBy: {
                    date: "desc",
                },
                take: 5,
            });

            res.status(200).json({
                message: "Recent fraudulent transactions",
                data: recentTransaction,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "An error occurred while retrieving recent fraudulent transactions.",
            });
        }
    }
}
