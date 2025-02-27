package org.whu.geoai_stval.spark_K_functions.space_K.partitioner;

import org.apache.spark.Partitioner;
import org.whu.geoai_stval.spark_K_functions.space_K.geom.SpatiotemporalEnvelope;
import org.whu.geoai_stval.spark_K_functions.space_K.geom.SpatiotemporalGeometry;
import scala.Tuple2;

import java.io.Serializable;
import java.util.Iterator;
import java.util.List;

/**
 * The spatiotemporal partitioner for spatiotemporal RDD
 */
public abstract class SpatiotemporalPartitioner extends Partitioner implements Serializable {
    protected final PartitionerType partitionerType;
    protected final List<SpatiotemporalEnvelope> cuboids;

    protected SpatiotemporalPartitioner(PartitionerType partitionerType, List<SpatiotemporalEnvelope> cuboids) {
        this.partitionerType = partitionerType;
        this.cuboids = cuboids;
    }

    public abstract <T extends SpatiotemporalGeometry> Iterator<Tuple2<Integer, T>> divideObject(T spatiotemporalObject) throws Exception;

    public PartitionerType getPartitionerType() {
        return partitionerType;
    }

    public List<SpatiotemporalEnvelope> getCuboids() {
        return cuboids;
    }

    @Override
    public int getPartition(Object key) {
        return (int) key;
    }
}
