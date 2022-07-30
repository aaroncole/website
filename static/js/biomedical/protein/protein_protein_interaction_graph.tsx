/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Protein-protein interaction graph
 */

import axios from "axios";
import _ from "lodash";
import React from "react";

import { drawProteinInteractionGraph } from "./chart";
import { BioDcid, MultiLevelInteractionGraphData } from "./types";

interface Props {
  centerProteinDcid: BioDcid;
}

interface State {
  // number of levels in graph, max shortest-path distance from any node to the center
  depth: number;
  // stores graph to be rendered
  graphData: MultiLevelInteractionGraphData;
  // number of expansion links per node
  numInteractions: number;
  // interaction score threshold above which to show an edge between two interacting proteins
  scoreThreshold: number;
}

const CHART_ID = "protein-interaction-graph";

const DEFAULTS = {
  DEPTH: 2,
  MAX_INTERACTIONS: 4,
  MISSING_SCORE_FILLER: -1,
  SCORE_THRESHOLD: 0.4,
};

export class ProteinProteinInteractionGraph extends React.Component<
  Props,
  State
> {
  constructor(props: Props) {
    super(props);
    this.state = {
      depth: DEFAULTS.DEPTH,
      graphData: null,
      numInteractions: DEFAULTS.MAX_INTERACTIONS,
      scoreThreshold: DEFAULTS.SCORE_THRESHOLD,
    };
  }

  componentDidMount(): void {
    this.fetchData();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    // do nothing on parent rerender or if we've loaded the same graph twice
    if (_.isEqual(prevProps, this.props) || _.isEqual(prevState, this.state)) {
      return;
    }
    // if graph has updated to something nonempty, redraw it
    if (
      !_.isEmpty(this.state.graphData) &&
      !_.isEqual(prevState.graphData, this.state.graphData)
    ) {
      drawProteinInteractionGraph(CHART_ID, {
        linkData: this.state.graphData.linkDataNested.flat(1),
        nodeData: this.state.graphData.nodeDataNested.flat(1),
      });
      return;
    }
    // if graph is the same but user input has changed, fetch new data
    this.fetchData();
  }

  render(): JSX.Element {
    return <div id={CHART_ID}></div>;
  }

  private fetchData(): void {
    axios
      .post("/api/protein/ppi/bfs/", {
        depth: this.state.depth,
        proteinDcid: this.props.centerProteinDcid,
        scoreThreshold: this.state.scoreThreshold,
        maxInteractors: this.state.numInteractions,
      })
      .then((resp) => {
        this.setState({ graphData: resp.data });
      });
  }
}