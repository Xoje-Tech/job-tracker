# Delta for v1-core-api

## ADDED Requirements

### Requirement: POST /api/v1/jobs - Validation of source and sourceId
The create-job endpoint MUST support and validate the `source` and `sourceId` fields in the request body.
- If `source` is provided, it MUST be a non-empty string. If it is omitted, it MUST default to `'MANUAL'`.
- If `sourceId` is provided, it MUST be a string or null. It MUST be optional.
- If either field fails string type validation, the endpoint MUST return `400 Bad Request`.

#### Scenario: Create job with valid source and sourceId
- GIVEN the database is available
- WHEN the user makes a `POST /api/v1/jobs` request with body:
  ```json
  {
    "title": "Backend Developer",
    "company": "Tech Corp",
    "source": "LINKEDIN",
    "sourceId": "123456789",
    "description": "Full-time role"
  }
  ```
- THEN the API returns status `201 Created`
- AND the response contains the created job with `source` set to `"LINKEDIN"` and `sourceId` set to `"123456789"`

#### Scenario: Create job with invalid source type
- GIVEN the database is available
- WHEN the user makes a `POST /api/v1/jobs` request with body:
  ```json
  {
    "title": "Backend Developer",
    "company": "Tech Corp",
    "source": true,
    "description": "Full-time role"
  }
  ```
- THEN the API returns status `400 Bad Request`
- AND the response contains an error message indicating invalid source field type

#### Scenario: Create job with invalid sourceId type
- GIVEN the database is available
- WHEN the user makes a `POST /api/v1/jobs` request with body:
  ```json
  {
    "title": "Backend Developer",
    "company": "Tech Corp",
    "source": "LINKEDIN",
    "sourceId": 12345,
    "description": "Full-time role"
  }
  ```
- THEN the API returns status `400 Bad Request`
- AND the response contains an error message indicating invalid sourceId field type


### Requirement: GET /api/v1/jobs - Filter by source and sourceId
The list-jobs endpoint MUST support filtering listings by `source` and `sourceId` query parameters to allow checking for existing external listings.
- If `source` is provided in the query string, the returned list MUST only include jobs matching that source.
- If `sourceId` is provided in the query string, the returned list MUST only include jobs matching that external ID.
- This allows clients to check if a specific external job listing has already been imported by querying `/api/v1/jobs?source=LINKEDIN&sourceId=<external-id>`.

#### Scenario: Filter jobs by source and sourceId (Job Exists)
- GIVEN the database contains a job with `source='LINKEDIN'` and `sourceId='4439336029'`
- WHEN the user makes a `GET /api/v1/jobs?source=LINKEDIN&sourceId=4439336029` request
- THEN the API returns status `200 OK`
- AND the response contains a `data` array with exactly 1 job matching the criteria
- AND the response `total` count is 1

#### Scenario: Filter jobs by source and sourceId (Job Does Not Exist)
- GIVEN the database does not contain any job with `source='LINKEDIN'` and `sourceId='nonexistent'`
- WHEN the user makes a `GET /api/v1/jobs?source=LINKEDIN&sourceId=nonexistent` request
- THEN the API returns status `200 OK`
- AND the response contains an empty `data` array
- AND the response `total` count is 0
