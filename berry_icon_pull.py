import requests
import os

berry_names = ['Cheri', 'Chesto','Pecha','Rawst','Aspear','Leppa','Oran','Persim','Lum',
'Sitrus','Figy', 'Wiki', 'Mago', 'Aguav','Iapapa','Razz', 'Bluk', 'Nanab','Wepear','Pinap',
'Pomeg','Kelpsy','Qualot','Hondew','Grepa','Tamato','Cornn','Magost','Rabuta','Nomel',
'Spelon','Pamtre','Watmel','Durin','Belue','Occa', 'Passho','Wacan','Rindo','Yache','Chople',
'Kebia','Shuca','Coba', 'Payapa','Tanga','Charti','Kasib','Haban','Colbur','Babiri','Chilan',
'Liechi','Ganlon','Salac','Petaya','Apicot','Lansat','Starf','Enigma','Micle','Custap','Jaboca','Rowap']

def download_img(berry_name):
  page_url = f"https://bulbapedia.bulbagarden.net/wiki/File:Tag{berry_name}.png"
  response = requests.get(page_url)
  partition = response.text.partition("//archives.bulbagarden.net/media/upload/")
  #4/4b/TagCheri.png
  after = partition[2].partition('"')[0]
  img_response = requests.get(f"https://archives.bulbagarden.net/media/upload/{after}")
  with open(f"berry_pull/{berry_name}/{berry_name}-icon.png", "wb") as f:
    f.write(img_response.content)

def download_berries(berry_names):
  print("Downloading...")
  for berry in berry_names:
    print(f"{berry}-icon.png")
    download_img(berry)
  
  print("done")


download_berries(berry_names)