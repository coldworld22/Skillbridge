import React from "react";
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";

// 🎨 Certificate Styles
const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#ffffff", padding: 30 },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  studentName: { fontSize: 20, textAlign: "center", fontWeight: "bold", marginBottom: 10 },
  bodyText: { fontSize: 16, textAlign: "center", marginBottom: 10 },
  signature: { fontSize: 14, textAlign: "right", marginTop: 30 },
});

const Certificate = ({ studentName, courseTitle }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Certificate of Completion</Text>
      <Text style={styles.studentName}>{studentName}</Text>
      <Text style={styles.bodyText}>Has successfully completed the course:</Text>
      <Text style={styles.bodyText}><strong>{courseTitle}</strong></Text>
      <Text style={styles.signature}>Instructor Signature</Text>
    </Page>
  </Document>
);

const CertificateDownload = ({ studentName, courseTitle }) => (
  <PDFDownloadLink document={<Certificate studentName={studentName} courseTitle={courseTitle} />} fileName="certificate.pdf">
    {({ loading }) => (
      <Button variant="accent">
        {loading ? "Generating..." : "🎓 Download Certificate"}
      </Button>
    )}
  </PDFDownloadLink>
);

export default CertificateDownload;
