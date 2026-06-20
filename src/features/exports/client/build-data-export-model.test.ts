import { describe, expect, it } from "vitest";
import { buildDataExportModel } from "./build-data-export-model";

const businessesList = [
  { id: "shami", displayName: "Shami", nameAr: "الشامي", nameEn: "Shami" },
  { id: "arz", displayName: "Arz", nameAr: "الأرز", nameEn: "Arz" },
];

describe("buildDataExportModel", () => {
  it("builds multi-store register operations sheet with numeric amounts", () => {
    const model = buildDataExportModel({
      lang: "ar",
      businessesList,
      operationalEntries: [],
      archivedBusinessIds: [],
      snapshot: {
        screen: "register",
        registerView: "operations",
        selectedBusiness: "all",
        includedBusinessIds: ["shami", "arz"],
        period: "month",
        selectedMonth: "2026-06",
        exportData: {
          visibleEntries: [
            {
              id: "1",
              businessId: "shami",
              date: "2026-06-05",
              type: "summary",
              amount: 1000,
              salesChannels: [{ channelId: "cash", name: "Cash", amount: 1000 }],
            },
            {
              id: "2",
              businessId: "arz",
              date: "2026-06-06",
              type: "expense",
              amount: 250,
              categoryId: "rent",
            },
          ],
        },
      },
    });

    expect(model?.sheets[0]?.name).toBe("العمليات");
    expect(model?.sheets[0]?.columns.some((column) => column.key === "store")).toBe(true);
    expect(model?.sheets[0]?.rows[0]?.amount).toBe(1000);
    expect(model?.sheets[0]?.rows[1]?.amount).toBe(-250);
  });

  it("builds register attachments sheet from gallery items", () => {
    const model = buildDataExportModel({
      lang: "ar",
      businessesList,
      operationalEntries: [],
      archivedBusinessIds: [],
      snapshot: {
        screen: "register",
        registerView: "attachments",
        selectedBusiness: "shami",
        includedBusinessIds: ["shami"],
        period: "month",
        selectedMonth: "2026-06",
        exportData: {
          attachmentGalleryItems: [
            {
              businessId: "shami",
              date: "2026-06-05",
              label: "صيانة",
              labelEn: "Maintenance",
              amount: 250,
              voided: false,
            },
          ],
        },
      },
    });

    expect(model?.meta.viewLabel).toBe("المرفقات");
    expect(model?.sheets[0]?.name).toBe("المرفقات");
    expect(model?.sheets[0]?.rows[0]?.amount).toBe(-250);
    expect(model?.sheets[0]?.rows[0]?.label).toBe("صيانة");
  });

  it("builds register monthly export sheet from general report rows", () => {
    const model = buildDataExportModel({
      lang: "en",
      businessesList,
      operationalEntries: [],
      archivedBusinessIds: [],
      snapshot: {
        screen: "register",
        registerView: "report",
        selectedBusiness: "shami",
        includedBusinessIds: ["shami"],
        period: "year",
        selectedYear: "2026",
        generalReportGranularity: "month",
        exportData: {
          generalReportRows: [
            { date: "2026-06", sales: 150, expense: 20, net: 130 },
            { date: "2026-05", sales: 30, expense: 0, net: 30 },
          ],
          generalReportGranularity: "month",
        },
      },
    });

    expect(model?.sheets[0]?.name).toBe("Monthly report");
    expect(model?.sheets[0]?.columns.find((column) => column.key === "date")?.label).toBe("Month");
    expect(model?.sheets[0]?.rows).toHaveLength(2);
    expect(model?.sheets[0]?.rows[0]?.date).toBe("06-2026");
  });

  it("builds combined home summary with summable store rows", () => {
    const model = buildDataExportModel({
      lang: "en",
      businessesList,
      operationalEntries: [],
      archivedBusinessIds: [],
      snapshot: {
        screen: "home",
        selectedBusiness: "all",
        includedBusinessIds: ["shami", "arz"],
        period: "day",
        selectedDate: "2026-06-05",
        summaryRecord: { sales: 3000, expense: 900, net: 2100, ratio: "30.0%", proofs: 0 },
        summaryBusinessRows: [
          { businessId: "shami", sales: 2000, expense: 500, net: 1500, ratio: "25.0%" },
          { businessId: "arz", sales: 1000, expense: 400, net: 600, ratio: "40.0%" },
        ],
      },
    });

    const summarySheet = model?.sheets.find((sheet) => sheet.name === "Stores summary");
    expect(summarySheet?.rows).toHaveLength(3);
    expect(summarySheet?.rows[0]?.sales).toBe(2000);
    expect(summarySheet?.rows[2]?.sales).toBe(3000);
    expect(summarySheet?.columns.find((column) => column.key === "sales")?.sum).toBe(true);
  });
});
