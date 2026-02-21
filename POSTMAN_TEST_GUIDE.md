# Postman Test Guide for Transcript Evaluation

## Endpoint
```
POST http://localhost:8080/api/transcripts/evaluate?program=Bachelor%20of%20Science%20in%20Electrical%20Engineering
```

## Request Headers
```
Content-Type: application/json
```

## Sample Request Body (Using the transcript from the document)

```json
{
  "studentId": 1,
  "transcripts": [
    {
      "year": 2021,
      "subjectCode": "MATH114",
      "courseName": "Differential Calculus",
      "grade": 5.0,
      "credits": 5.00
    },
    {
      "year": 2021,
      "subjectCode": "MATH113",
      "courseName": "Mathematics for Engineers",
      "grade": 5.0,
      "credits": 5.00
    },
    {
      "year": 2021,
      "subjectCode": "COMP111",
      "courseName": "Computer-Aided Drafting",
      "grade": 1.75,
      "credits": 1.75
    },
    {
      "year": 2021,
      "subjectCode": "FIL1",
      "courseName": "Konekstualisadong Komunikasyon sa Filipino",
      "grade": 1.0,
      "credits": 1.00
    },
    {
      "year": 2021,
      "subjectCode": "GE1",
      "courseName": "Understanding the Self",
      "grade": 1.5,
      "credits": 1.50
    },
    {
      "year": 2021,
      "subjectCode": "GE2",
      "courseName": "Readings in Philippine History: Mga Babasahin Hinggil sa Kasaysayan ng Pilipinas",
      "grade": 1.75,
      "credits": 1.75
    },
    {
      "year": 2021,
      "subjectCode": "PE1",
      "courseName": "Advanced Gymnastics",
      "grade": 2.0,
      "credits": 2.00
    },
    {
      "year": 2021,
      "subjectCode": "NSTP1",
      "courseName": "National Service Training Program 1",
      "grade": 1.0,
      "credits": 1.00
    },
    {
      "year": 2021,
      "subjectCode": "GE5",
      "courseName": "Purposive Communication",
      "grade": 1.75,
      "credits": 1.75
    },
    {
      "year": 2021,
      "subjectCode": "FIL2",
      "courseName": "Wika sa Ibat'ibang Disiplina",
      "grade": 1.5,
      "credits": 1.50
    },
    {
      "year": 2022,
      "subjectCode": "CHEM114",
      "courseName": "Chemistry for Engineers",
      "grade": 2.0,
      "credits": 2.00
    },
    {
      "year": 2022,
      "subjectCode": "PE2",
      "courseName": "Rhythmic Activities/Folk Dance/Social Dances",
      "grade": 2.5,
      "credits": 2.50
    },
    {
      "year": 2022,
      "subjectCode": "GE3",
      "courseName": "The Contemporary World",
      "grade": 2.25,
      "credits": 2.25
    },
    {
      "year": 2022,
      "subjectCode": "GE4",
      "courseName": "Mathematics in the Modern World",
      "grade": 2.5,
      "credits": 2.50
    },
    {
      "year": 2022,
      "subjectCode": "NSTP2",
      "courseName": "National Service Training Program 2",
      "grade": 1.0,
      "credits": 1.00
    }
  ]
}
```

## Steps in Postman:

1. **Create a new POST request**
   - Click the "+" tab or "New" button
   - Select "Request"

2. **Set the URL**
   - Paste the endpoint URL above
   - Make sure to replace `program` parameter with your actual program name

3. **Set Headers**
   - Go to "Headers" tab
   - Ensure `Content-Type: application/json` is set

4. **Set Body**
   - Click on "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste the sample JSON request body

5. **Send the Request**
   - Click "Send" button
   - The response will contain the list of evaluated transcripts

## Expected Response (Success - 200 OK)

```json
[
  {
    "id": 1,
    "transcript": {
      "id": 1,
      "courseName": "Differential Calculus",
      "subjectCode": "MATH114",
      "credits": 5.00,
      "grade": 5.0,
      "year": 2021
    },
    "curricula": {
      "id": 1,
      "courseTitle": "Differential Calculus",
      "units": 5.0
    },
    "confidenceScore": 95.5,
    "evaluationStatus": "HIGH_CONFIDENCE_MATCH",
    "decisionType": "AUTO",
    "finalApproved": true,
    "remarks": "Equivalent course found"
  },
  ...
]
```

## Error Response (500 Internal Server Error)

```json
"Error during transcript evaluation: Student not found"
```

**Note:** Make sure the `studentId` (1 in this example) exists in your database.
