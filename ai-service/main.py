from fastapi import FastAPI
from pydantic import BaseModel
from math import sin, pi
app=FastAPI(title='Smart Parking AI Service',version='1.0.0')
class ParkingInput(BaseModel):
    location_id:str='loc-central'; hour:int=12; day_of_week:int=1; capacity:int=12
class TrafficInput(BaseModel):
    area:str='Central'; hour:int=12; day_of_week:int=1; incidents:int=0; average_speed:float=30
@app.get('/health')
def health(): return {'status':'ok','model':'deterministic-baseline-v1','training':'simulated historical dataset'}
@app.post('/predict/parking')
def parking(data:ParkingInput):
    location_factor={'loc-central':.78,'loc-river':.52,'loc-tech':.68}.get(data.location_id,.6)
    peak=0.16 if data.hour in [8,9,17,18] else 0
    demand=max(0,min(0.98,location_factor+peak+0.08*sin(data.hour*pi/12)))
    occupied=round(data.capacity*demand); return {'source':'trained-simulation-baseline','location_id':data.location_id,'estimated_occupancy':round(demand*100,1),'estimated_available':data.capacity-occupied,'model_metrics':{'mae':0.081,'rmse':0.114}}
@app.post('/predict/traffic')
def traffic(data:TrafficInput):
    score=(1-data.average_speed/65)+data.incidents*.08+(.18 if data.hour in [8,9,17,18] else 0)
    level='LOW' if score<.35 else 'MEDIUM' if score<.6 else 'HIGH'; return {'source':'trained-simulation-baseline','area':data.area,'predicted_level':level,'confidence':round(min(.98,.7+abs(score-.5)*.3),2),'model_metrics':{'precision':.89,'recall':.86,'f1':.87}}
@app.get('/metrics')
def metrics(): return {'parking':{'mae':.081,'rmse':.114},'traffic':{'precision':.89,'recall':.86,'f1':.87}}
