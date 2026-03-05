from fastapi import FastAPI

app = FastAPI()

@app.get("/") # decorator and its for API, these are fastapi instance
async def root():
    return {"message":"Hello world"}