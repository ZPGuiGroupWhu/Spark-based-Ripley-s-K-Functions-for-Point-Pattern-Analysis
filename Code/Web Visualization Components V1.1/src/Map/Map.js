import React from 'react';
import './Map.css';
import DeckGL from '@deck.gl/react';
import {FlyToInterpolator} from 'deck.gl';
import {GeoJsonLayer} from '@deck.gl/layers';
import {PolygonLayer} from '@deck.gl/layers';
import {StaticMap} from 'react-map-gl';
// 1003个feature
// import jsonData from './data/95_2_10_84.json';
import SampleData from './chongqing.json';
import SampleData_2 from './hubei.json';
import LocalJsonData from './JsonData.json';
// const gridData = jsonData.features;

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiYmlsbGN1aSIsImEiOiJjampsYjZpbzQwcm1mM3FwZmppejRzMmNiIn0.Ch9L9-zpzaC21Vm8yxoWpg';

let ID = 10;

export default class Map extends React.Component {
  constructor(props) {
    super(props);
    //TODO 测试用代码
    this.jsonDataCache = LocalJsonData;
    
    // this.jsonDataCache = [];
    this.state = {
      id: 0,
      layers: null,
      boundary:null,
      initialViewState:{
        longitude: 107,
        latitude: 29.5,
        zoom: 8,
        pitch: 45,
        bearing: 0
      },
      hoveredMessage: null,
      pointerX: null,
      pointerY: null,
      nanoList:[]
    };
  };
  componentDidMount(){
    // this.getLayers();
  }
  componentDidUpdate(prevProps){
    if(this.isPropsChange(prevProps)){
      this.setState({nanoList:this.props.DataMap["nanoList"]})
      ID++;
      if(!prevProps.DataMap||this.props.DataMap["id"]!==prevProps.DataMap["id"]){//当数据源切换时，建立缓存，并更改可视区域
        if(this.jsonDataCache[this.props.DataMap["id"]]==null)this.jsonDataCache[this.props.DataMap["id"]]={};
        this.setState({initialViewState:{
          longitude: this.props.DataMap['longitude'],
          latitude: this.props.DataMap['latitude'],
          zoom:  this.props.DataMap['zoom'],
          pitch: this.state.initialViewState['pitch'],
          bearing: this.state.initialViewState['bearing'],
          transitionDuration: 2000,
          transitionInterpolator: new FlyToInterpolator()
        }})
      }
      this.getLayers();
    }
  } 

  isPropsChange = (prevProps) => {
    let isChange =  prevProps.dimension !== this.props.dimension;
    const keys = ['isRShow', 'isGShow', 'isBShow', 'RContent', 'GContent', 'BContent'];
    for (let i = 0; i < 6; i++) {
      isChange = isChange || (prevProps.colorObj[keys[i]] !== this.props.colorObj[keys[i]]);
    }
    isChange = isChange || prevProps.scale !== this.props.scale;
    isChange = isChange || prevProps.DataMap !== this.props.DataMap;
    return isChange;
  }

  onViewStateChange=({viewState}) => {
    // Save the view state and trigger rerender
    this.setState({initialViewState:viewState});
  }

  _renderTooltip() {
    const {hoveredMessage, pointerX, pointerY} = this.state || {};
    return hoveredMessage && (
      <div style={{position: 'absolute', zIndex: 999, pointerEvents: 'none', left: pointerX, top: pointerY, color: '#fff', backgroundColor: 'rgba(100,100,100,0.5)',"whiteSpace": "pre"}}>
        { hoveredMessage }
      </div>
    );
  }

  getLayers = () => {
    if(this.props.DataMap==null)return null;
    const scale = this.props.scale;
    let jsonData = this.jsonDataCache[this.props.DataMap["id"]][scale];
    if (!jsonData) {
      this.loadJsonData(this.props.scale).then(() => {
        this.setState({ layers: this.props.dimension === 3 ? [this.get3Dlayer(scale)] : [this.get2Dlayer(scale)] });
        // if(this.props.DataMap!=null)this.setState({ boundary:this.getBoundarylayer(JSON.parse(this.props.DataMap["boundaryData"]))});//Here
        this.props.changePieChart(this.jsonDataCache[this.props.DataMap["id"]][scale].properties);

        //TODO 测试用代码,与上方注释代码切换使用
        if(this.props.DataMap["id"]=='chongqing'){
          this.setState({ boundary:this.getBoundarylayer(SampleData)});
        }
        else
        {
          this.setState({ boundary:this.getBoundarylayer(SampleData_2)});
        }

      })
    } else {
      this.setState({ layers: this.props.dimension === 3 ? [this.get3Dlayer(scale)] : [this.get2Dlayer(scale)] });
      // if(this.props.DataMap!=null)this.setState({ boundary:this.getBoundarylayer(JSON.parse(this.props.DataMap["boundaryData"]))});//Here
      this.props.changePieChart(this.jsonDataCache[this.props.DataMap["id"]][scale].properties);

        //TODO 测试用代码,与上方注释代码切换使用
        if(this.props.DataMap["id"]=='chongqing'){
          this.setState({ boundary:this.getBoundarylayer(SampleData)});
        }
        else
        {
          this.setState({ boundary:this.getBoundarylayer(SampleData_2)});
        }
    }
  }

  loadJsonData = (scale) => {
    var url = "http://localhost:8011/nanocubeGridV4?hostname=http://192.168.213.130:51234&level=" + scale;
    if(this.props.DataMap!=null) url = "http://192.168.200.160:8011/"+this.props.DataMap["nanoURL"]+"&level=" + scale;
    // console.log("Map -> url", url)
    return fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
        this.jsonDataCache[this.props.DataMap["id"]][scale] = responseJson;
      });
  }

  getFillColorArray = (d) => {
    const { isRShow, isGShow, isBShow, RContent, GContent, BContent } = this.props.colorObj;
    var r,g,b;
    r = isRShow ? d[this.state.nanoList[RContent]]*255/500 : 0;
    g = isGShow ? d[this.state.nanoList[GContent]]*255/500 : 0;
    b = isBShow ? d[this.state.nanoList[BContent]]*255/500 : 0;
    return [r, g, b,  r+g+b > 0 ? 180 :0];
  };

  getElevationValue = (d) => {
    const { isRShow, isGShow, isBShow, RContent, GContent, BContent } = this.props.colorObj;
    var r,g,b;
    r = isRShow ? d[this.state.nanoList[RContent]]: 0;
    g = isGShow ? d[this.state.nanoList[GContent]]: 0;
    b = isBShow ? d[this.state.nanoList[BContent]]: 0;
    const value = Math.sqrt(r+g+b);
    return value;
  }

  get2Dlayer = (scale) => {
    const { isRShow, isGShow, isBShow } = this.props.colorObj;
    if (!(isRShow || isGShow || isBShow)) {
      return null;
    }
    let jsonData = this.jsonDataCache[this.props.DataMap["id"]][scale];
    return new GeoJsonLayer({
      id: ID,
      data: jsonData,
      pickable: true,
      stroked: false,
      filled: true,
      extruded: true,
      lineWidthScale: 20,
      lineWidthMinPixels: 2,
      getFillColor: (d) => { return this.getFillColorArray(d.properties) },
      getRadius: 100,
      getLineWidth: 1,
      getElevation: 30,
      onHover: ({color, index, x, y}) => {
        var str=""
        if(typeof(jsonData.features[index]) !== "undefined")
        {
          for(var i=0;i<this.state.nanoList.length;i++)
          {
            str=str+this.state.nanoList[i]+":"+jsonData.features[index].properties[this.state.nanoList[i]]+"\n"
          }
        }
        const tooltip = jsonData.features[index] && str
        this.setState({
          hoveredMessage: tooltip,
          pointerX: x,
          pointerY: y,
        });
      }
    });
  }

  get3Dlayer = (scale) => {
    const {isRShow, isGShow, isBShow} = this.props.colorObj;
    if(!(isRShow || isGShow || isBShow)) {
      return null;
    }
    let gridData = this.jsonDataCache[this.props.DataMap["id"]][scale].features;
    
    return new GeoJsonLayer({
      id: ID,
      data: gridData,
      pickable: true,
      stroked: false,
      filled: true,
      extruded: true,
      elevationScale: 1000,
      getFillColor: (d) => { return this.getFillColorArray(d.properties); },
      getElevation: (d) => { return this.getElevationValue(d.properties); },
      onHover: ({ color, index, x, y }) => {
        var str=""
        if(typeof(gridData[index]) !== "undefined")
        {
          for(var i=0;i<this.state.nanoList.length;i++){
            str=str+this.state.nanoList[i]+":"+gridData[index].properties[this.state.nanoList[i]]+"\n"
          }
        }
        const tooltip = gridData[index] && str
        this.setState({
          hoveredMessage: tooltip,
          pointerX: x,
          pointerY: y,
        });
      }
    });
  }
 
  getBoundarylayer = (boundData) => {
    return new GeoJsonLayer({
      id: 'boundary-layer',
      data: boundData,
      pickable: true,
      stroked: true,
      filled: false,
      wireframe: true,
      lineWidthMinPixels: 1,
      autoHighlight:false,
      getFillColor: [240, 230, 140, 40],
      highlightColor: [240, 230, 140, 120],
      lineWidthScale:100,
      getLineColor: [255, 215, 0],
      getLineWidth: 10,
      onHover: ({color, index, x, y}) => {
      }
    });
  }
  render() {
    return <div>
        <div id="map">
          <DeckGL
          viewState={this.state.initialViewState}
          controller={true}
          onViewStateChange={this.onViewStateChange}
          layers={[this.state.layers,this.state.boundary]}
          >
          <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle={'mapbox://styles/billcui/ck812rhuo0bv31iqs759izo8m'}/>
          { this._renderTooltip() }
          </DeckGL>
        </div>
      </div>
  }
}