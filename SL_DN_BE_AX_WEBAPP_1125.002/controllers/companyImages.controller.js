import knexLib from "knex";
import knexConfig from "../knexfile.js";
import path from "path";
import { fileURLToPath } from "url";

const knex = knexLib(knexConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function updateCompanyImages(req, res) {
  console.log(req.body);
  try {
    const {
      company_code,
      company_gst,
      company_name,
      company_phone_number,
      pr_limit_config,
      goods_receipt,
      company_upi,
      bank_name,
      account_no,
      ifsc_code,
      gpay_number,
      services,
      fetch_limit,
      company_street,
      company_city,
      company_state,
      company_pincode,
      whatsapp,
      page_type,
    } = req.body;
    console.log(req.body);

    let logo = null;
    let background_image = null;
    let pdf_header = null;
    let pdf_footer = null;

    if (req.files["logo"] && req.files["logo"].length > 0) {
      logo = req.files["logo"].map((file) => file.filename);
    }

    if (req.files["background"] && req.files["background"].length > 0) {
      background_image = req.files["background"].map((file) => file.filename);
    }

    if (req.files["pdf_header"] && req.files["pdf_header"].length > 0) {
      pdf_header = req.files["pdf_header"].map((file) => file.filename);
    }

    if (req.files["pdf_footer"] && req.files["pdf_footer"].length > 0) {
      pdf_footer = req.files["pdf_footer"].map((file) => file.filename);
    }

    const new_company = await knex("company_details")
      .limit(1)
      .update({
        company_code,
        company_gst,
        company_name,
        company_upi,
        company_phone_number,
        pr_limit_config,
        logo: logo !== null ? logo : knex.raw("logo"),
        goods_receipt,
        background_image: background_image !== null ? background_image : knex.raw("background_image"),
        bank_name,
        account_no,
        ifsc_code,
        gpay_number,
        whatsapp,
        services,
        fetch_limit,
        pdf_header: pdf_header !== null ? pdf_header : knex.raw("pdf_header"),
        pdf_footer: pdf_footer !== null ? pdf_footer : knex.raw("pdf_footer"),
        company_street,
        company_city,
        company_state,
        company_pincode,
        page_type
      });

    res
      .status(200)
      .send({ message: "Company details updated successfully", new_company });
  } catch (error) {
    console.error("Error updating company details:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
}

export async function getCompanyImage(req, res) {
  const { type, filename } = req.params;
  let dir;

  switch (type) {
    case "logo":
      dir = "company/logo";
      break;
    case "background":
      dir = "company/background";
      break;
    case "pdf_header":
      dir = "pdf/header";
      break;
    case "pdf_footer":
      dir = "pdf/footer";
      break;
    default:
      return res.status(400).send({ error: "Invalid image type" });
  }

  const filePath = path.join(__dirname, "../", dir, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving company image:", err);
      res.status(err.status).end();
    }
  });
}
