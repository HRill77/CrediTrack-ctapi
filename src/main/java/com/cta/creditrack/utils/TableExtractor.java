package com.cta.creditrack.utils;


import com.google.cloud.documentai.v1.Document;

import java.util.ArrayList;
import java.util.List;

public class TableExtractor {

    public static List<List<String>> extractTables(Document document) {

        List<List<String>> rows = new ArrayList<>();

        for (Document.Page page : document.getPagesList()) {

            for (Document.Page.Table table : page.getTablesList()) {

                for (Document.Page.Table.TableRow row : table.getBodyRowsList()) {

                    List<String> rowData = new ArrayList<>();

                    for (Document.Page.Table.TableCell cell : row.getCellsList()) {

                        String text = getText(document, cell.getLayout().getTextAnchor());
                        rowData.add(text);
                    }

                    rows.add(rowData);
                }
            }
        }

        return rows;
    }

    private static String getText(Document document, Document.TextAnchor anchor) {

        StringBuilder sb = new StringBuilder();

        for (Document.TextAnchor.TextSegment segment : anchor.getTextSegmentsList()) {

            int start = (int) segment.getStartIndex();
            int end = (int) segment.getEndIndex();
            sb.append(document.getText().substring(start, end));
        }

        return sb.toString().trim();
    }
}

