import numpy as np
import math
songList=[]

f = open("./Brain/songList.txt", 'r')
while True:
    line = f.readline()[:-1]
    if not line: break
    songList.append(line)
f.close()


like_mat = np.loadtxt('./Brain/predict_mat.txt', usecols=range(200))
epochs=0
test=songList
hate = np.loadtxt('./Brain/hate_list.txt', usecols=range(200))
like = np.loadtxt('./Brain/like_list.txt', usecols=range(200))


Euclidean = np.loadtxt('./Brain/Euclidean.txt', usecols=range(200))

def normalize(a):
    for i in range(a.shape[0]):
        tot=0
        for j in range(a.shape[1]):
            if(a[i, j]!=0):
                a[i, j]=1/a[i, j]
            tot+=a[i,j]
        for j in range(a.shape[1]):
            a[i, j]=a[i, j]/tot
    return a
Euclidean=(normalize(Euclidean))
for i in range(hate.shape[0]):
    for j in range(hate.shape[1]):
        hate[i, :]+=hate[i, j]*Euclidean[i, :]
for i in range(like.shape[0]):
    for j in range(like.shape[1]):
        like[i, :]+=like[i, j]*Euclidean[i, :]
for i in test:
    for j in test:
        if(hate[songList.index(i), songList.index(j)]!=0  or like[songList.index(i), songList.index(j)]!=0):
            like_mat[songList.index(i),songList.index(j)]=like[songList.index(i), songList.index(j)]/(hate[songList.index(i), songList.index(j)]+like[songList.index(i), songList.index(j)])
        else:
            like_mat[songList.index(i),songList.index(j)]= 1/2
# input data
inputs = np.identity(len(songList))
# output data
outputs = like_mat #interest of the uses, need change
class NeuralNetwork():
    global epochs
    # intialize variables in class
    def __init__(self, inputs, outputs):
        self.inputs  = inputs
        self.outputs = outputs
        # initialize weights as .50 for simplicity
        self.weights = like_mat
        self.error_history = []
        self.epoch_list = []

    def sigmoid(self, x, deriv=False):
        if deriv == True:
            return x * (1 - x)
        return 1 / (1 + np.exp(-x))

    # data will flow through the neural network.
    def feed_forward(self):
        self.hidden = self.sigmoid(np.dot(self.inputs, self.weights))

    # going backwards through the network to update weights
    def backpropagation(self):
        self.error  = self.outputs - self.hidden
        delta = self.error * self.sigmoid(self.hidden, deriv=True)
        self.weights += np.dot(self.inputs.T, delta)

    # train the neural net for 25,000 iterations
    def train(self, reqEpoch=100):
        for epochs in range(reqEpoch):
            # flow forward and produce an output
            self.feed_forward()
            # go back though the network to make corrections based on the output
            self.backpropagation()
            # keep track of the error history over each epoch
            self.error_history.append(np.average(np.abs(self.error)))
            self.epoch_list.append(epochs)
            epochs+=1

    # function to predict output on new and unseen input data
    def predict(self, new_input):
        prediction = self.sigmoid(np.dot(new_input, self.weights))
        return prediction

NN = NeuralNetwork(inputs, outputs)
# train neural network
NN.train()
result=NN.predict(inputs)
np.savetxt('./Brain/predict_mat_raw.txt',result,fmt='%.15f')
for i in range(result.shape[0]):
    tot=0
    for j in range(result.shape[1]):
        result[i, j]=1/result[i, j]
        tot+=result[i,j]
    for j in range(result.shape[1]):
        result[i, j]=result[i, j]/tot
np.savetxt('./Brain/predict_mat.txt',result,fmt='%.15f')
