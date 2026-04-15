/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const applicationId = url.searchParams.get("applicationId");

    if (!applicationId) {
      return jsonError("Application ID is required", 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Unauthorized", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return jsonError("Unauthorized", 401);
    }

    const { data: application, error: appError } = await supabase
      .from("scholarship_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return jsonError("Application not found", 404);
    }

    const { data: isAdminData } = await supabase.rpc("is_admin", { uid: user.id });
    const isOwner = application.student_id === user.id;

    if (!isOwner && !isAdminData) {
      return jsonError("Forbidden", 403);
    }

    if (application.status !== "approved") {
      return jsonError("Application not approved", 400);
    }

    const certificate = await supabase
      .from("certificates")
      .select("*")
      .eq("application_id", applicationId)
      .maybeSingle();

    let serialCode: string;
    let authSignature: string;

    if (certificate.data) {
      serialCode = certificate.data.serial_code;
      authSignature = certificate.data.auth_signature;
    } else {
      const { data: serialData, error: serialError } = await supabase.rpc("generate_serial_code");

      if (serialError || !serialData) {
        return jsonError("Failed to generate serial code", 500);
      }

      serialCode = serialData as string;

      const { data: signatureData, error: signatureError } = await supabase.rpc(
        "compute_auth_signature",
        { serial: serialCode, app_id: applicationId },
      );

      if (signatureError || !signatureData) {
        return jsonError("Failed to compute signature", 500);
      }

      authSignature = signatureData as string;

      const { error: insertError } = await supabase
        .from("certificates")
        .insert({
          application_id: applicationId,
          student_id: application.student_id,
          serial_code: serialCode,
          auth_signature: authSignature,
          storage_path: "",
        });

      if (insertError) {
        console.error("Failed to create certificate:", insertError);
        return jsonError("Failed to create certificate", 500);
      }
    }

const pdfBytes = await createReferenceLetterPDF({
  applicantName: application.full_name || "Not specified",
  studyLevel: application.level_of_study || "Not specified",
  courseName: application.course_title || "Not specified",
  courseDuration: application.course_duration || "To be determined",
  applicationDate: new Date(application.created_at).toLocaleDateString(),
  institutionName: application.university_name || "Not specified",
  serialCode,
  authSignature,
});

return new Response(pdfBytes as unknown as BodyInit, {
  headers: {
    ...corsHeaders,
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="NAMA_Recommendation_${serialCode}.pdf"`,
  },
});

// return new Response(pdfBlob, {
//   headers: {
//     ...corsHeaders,
//     "Content-Type": "application/pdf",
//     "Content-Disposition": `attachment; filename="NAMA_Recommendation_${serialCode}.pdf"`,
//   },
// });
  } catch (error) {
    console.error("Error generating certificate:", error);
    return jsonError("Server error while generating certificate", 500);
  }
});

function jsonError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function createReferenceLetterPDF(data: {
  applicantName: string;
  studyLevel: string;
  courseName: string;
  courseDuration: string;
  applicationDate: string;
  institutionName: string;
  serialCode: string;
  authSignature: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let headerLogoImage = null;

  try {
    const logoUrl = "https://nama-uni-match.vercel.app/nama-logo.png";
    const logoResponse = await fetch(logoUrl);

    if (logoResponse.ok) {
      const logoBytes = await logoResponse.arrayBuffer();
      headerLogoImage = await pdfDoc.embedPng(new Uint8Array(logoBytes));
    }
  } catch (e) {
    console.log("Logo not available, skipping:", e);
  }

  const drawText = (
    text: string,
    x: number,
    y: number,
    size = 12,
    bold = false,
    color = rgb(0, 0, 0),
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  const wrapText = (
    text: string,
    maxWidth: number,
    fontSize: number,
    usedFont: typeof font,
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = usedFont.widthOfTextAtSize(testLine, fontSize);

      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const leftMargin = 62;
  const rightMargin = 533;
  const maxWidth = rightMargin - leftMargin;

  let y = 779;

  if (headerLogoImage) {
    const maxLogoHeight = 60;
    const maxLogoWidth = maxWidth;

    let logoHeight = maxLogoHeight;
    let logoWidth = (headerLogoImage.width / headerLogoImage.height) * logoHeight;

    if (logoWidth > maxLogoWidth) {
      logoWidth = maxLogoWidth;
      logoHeight = (headerLogoImage.height / headerLogoImage.width) * logoWidth;
    }

    const logoX = leftMargin + (maxWidth - logoWidth) / 2;
    const logoY = y - logoHeight;

    page.drawImage(headerLogoImage, {
      x: logoX,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
    });

    y = logoY - 18;
  }

  const brandY = y;
  drawText("NAMA Uni-Scholarship", leftMargin, brandY, 18, true, rgb(0.0, 0.4, 0.8));

  let contactY = brandY;
  const contactLineHeight = 13;

  drawText("NAMA Uni-Scholarship", rightMargin - font.widthOfTextAtSize("NAMA Uni-Scholarship", 9), contactY, 9);
  contactY -= contactLineHeight;

  drawText(
    "Official Scholarship Matching Platform",
    rightMargin - font.widthOfTextAtSize("Official Scholarship Matching Platform", 9),
    contactY,
    9,
  );
  contactY -= contactLineHeight;

  drawText(
    "Email: support@uni-scholarship.com",
    rightMargin - font.widthOfTextAtSize("Email: support@uni-scholarship.com", 9),
    contactY,
    9,
  );
  contactY -= contactLineHeight;

  drawText(
    "Website: nama-uni-match.vercel.app",
    rightMargin - font.widthOfTextAtSize("Website: nama-uni-match.vercel.app", 9),
    contactY,
    9,
  );

  y = Math.min(contactY - 26, brandY - 26);

  y -= 30;
  const titleText = "Scholarship Verification & Recommendation Letter";
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 16);
  const centerX = (595.28 - titleWidth) / 2;
  drawText(titleText, centerX, y, 16, true, rgb(0.0, 0.4, 0.8));

  y -= 50;
  const columnGap = 30;
  const leftColX = leftMargin;
  const rightColX = leftMargin + (maxWidth / 2) + columnGap;
  const colWidth = (maxWidth - columnGap) / 2;

  const renderField = (label: string, value: string, x: number, startY: number): number => {
    drawText(label.toUpperCase(), x, startY, 9, false, rgb(0.4, 0.4, 0.4));
    let currentY = startY - 14;

    const lines = wrapText(value, colWidth, 12, fontBold);
    for (const line of lines) {
      drawText(line, x, currentY, 12, true);
      currentY -= 17;
    }

    return currentY - 10;
  };

  let leftY = y;
  let rightY = y;

  leftY = renderField("Applicant Name", data.applicantName, leftColX, leftY);
  rightY = renderField("Study Level", data.studyLevel, rightColX, rightY);
  y = Math.min(leftY, rightY);

  leftY = y;
  rightY = y;

  leftY = renderField("Course Name", data.courseName, leftColX, leftY);
  rightY = renderField("Course Duration", data.courseDuration || "To be determined", rightColX, rightY);
  y = Math.min(leftY, rightY);

  leftY = y;
  rightY = y;

  leftY = renderField("Issued Date", data.applicationDate, leftColX, leftY);
  rightY = renderField("Institution Name", data.institutionName, rightColX, rightY);
  y = Math.min(leftY, rightY);

  y -= 30;

  const para1 = `NAMA Uni-Scholarship confirms that ${data.applicantName} is a verified applicant registered within our platform and matched to ${data.institutionName} for the program stated above. As part of our partner collaboration network, we hereby recommend the applicant for consideration of any available tuition scholarships, fee waivers, or financial assistance applicable to this program.`;

  const para1Lines = wrapText(para1, maxWidth, 11, font);
  for (let i = 0; i < para1Lines.length; i++) {
    const line = para1Lines[i];
    const isLastLine = i === para1Lines.length - 1;

    if (!isLastLine && line.includes(" ")) {
      const words = line.split(" ");
      const lineWidth = font.widthOfTextAtSize(line, 11);
      const extraSpace = maxWidth - lineWidth;
      const gaps = words.length - 1;
      const spacePerGap = gaps > 0 ? extraSpace / gaps : 0;

      let xPos = leftMargin;
      words.forEach((word) => {
        drawText(word, xPos, y, 11);
        const wordWidth = font.widthOfTextAtSize(word, 11);
        const spaceWidth = font.widthOfTextAtSize(" ", 11);
        xPos += wordWidth + spaceWidth + spacePerGap;
      });
    } else {
      drawText(line, leftMargin, y, 11);
    }

    y -= 17;
  }

  y -= 10;

  const para2 = `This recommendation is based on the applicant's verified academic records and declared study intent. For authenticity or supporting documentation, please visit our website at nama-uni-match.vercel.app or contact the NAMA Uni-Scholarship Office at support@uni-scholarship.com.`;

  const para2Lines = wrapText(para2, maxWidth, 11, font);
  for (let i = 0; i < para2Lines.length; i++) {
    const line = para2Lines[i];
    const isLastLine = i === para2Lines.length - 1;

    if (!isLastLine && line.includes(" ")) {
      const words = line.split(" ");
      const lineWidth = font.widthOfTextAtSize(line, 11);
      const extraSpace = maxWidth - lineWidth;
      const gaps = words.length - 1;
      const spacePerGap = gaps > 0 ? extraSpace / gaps : 0;

      let xPos = leftMargin;
      words.forEach((word) => {
        drawText(word, xPos, y, 11);
        const wordWidth = font.widthOfTextAtSize(word, 11);
        const spaceWidth = font.widthOfTextAtSize(" ", 11);
        xPos += wordWidth + spaceWidth + spacePerGap;
      });
    } else {
      drawText(line, leftMargin, y, 11);
    }

    y -= 17;
  }

  y -= 30;

  const disclaimer =
    "This is a computer-generated document issued by NAMA Uni-Scholarship. No handwritten signature is required.";

  const disclaimerLines = wrapText(disclaimer, maxWidth, 9, font);
  for (const line of disclaimerLines) {
    const lineWidth = font.widthOfTextAtSize(line, 9);
    const lineCenterX = (595.28 - lineWidth) / 2;
    drawText(line, lineCenterX, y, 9, false, rgb(0.5, 0.5, 0.5));
    y -= 13;
  }

  y -= 8;
  const verifyText = "Verify authenticity at nama-uni-match.vercel.app";
  const verifyWidth = font.widthOfTextAtSize(verifyText, 9);
  const verifyCenterX = (595.28 - verifyWidth) / 2;
  drawText(verifyText, verifyCenterX, y, 9, false, rgb(0.4, 0.4, 0.4));

  y -= 16;
  const serialLabel = "Serial:";
  const serialValue = data.serialCode;
  const issuedLabel = "Issued on:";
  const issuedValue = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  drawText(`${serialLabel} `, leftMargin, y, 9, true, rgb(0.0, 0.263, 0.769));
  const serialLabelWidth = fontBold.widthOfTextAtSize(`${serialLabel} `, 9);
  drawText(serialValue, leftMargin + serialLabelWidth, y, 9, true, rgb(0.0, 0.263, 0.769));

  const issuedText = `${issuedLabel} ${issuedValue}`;
  const issuedWidth = font.widthOfTextAtSize(issuedText, 9);
  drawText(issuedText, rightMargin - issuedWidth, y, 9, false, rgb(0.4, 0.4, 0.4));

  return await pdfDoc.save();
}